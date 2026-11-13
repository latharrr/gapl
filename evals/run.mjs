// Gapl offline evaluation harness. Runs the repo's real logic (imported from src/)
// against synthetic fixtures. No network, no API keys, no paid inference.
// Usage: npx tsx evals/run.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { validateResumeContent, extractText } from "../src/lib/resume-parser.ts";
import { validateAnalysisPayload } from "../src/lib/analysis-validation.ts";
import { buildAnalysisPrompt } from "../src/lib/prompt.ts";

const FX = new URL("./fixtures/", import.meta.url).pathname;
const manifest = JSON.parse(readFileSync(join(FX, "manifest.json"), "utf8"));
const results = { runAt: new Date().toISOString(), suites: {} };

// ---------- Suite 1: upload gate (validateResumeContent) ----------
{
  const tp = [], fn = [], fp = [], tn = [];
  for (const r of manifest.resumes) {
    const text = readFileSync(join(FX, r.file), "utf8");
    const v = validateResumeContent(text);
    (v.isResume ? tp : fn).push({ file: r.file, reason: v.reason || undefined });
  }
  for (const n of manifest.nonResumes) {
    const text = readFileSync(join(FX, n.file), "utf8");
    const v = validateResumeContent(text);
    (v.isResume ? fp : tn).push({ file: n.file, reason: v.reason || undefined });
  }
  // Adversarial probes count in the denominator, on the side their idealExpectation assigns:
  // "accept" probes are real resumes the gate should accept, "reject" probes are junk it should reject.
  const advAccept = manifest.adversarial.filter((a) => (a.idealExpectation || "accept") === "accept");
  const advReject = manifest.adversarial.filter((a) => a.idealExpectation === "reject");
  const adv = manifest.adversarial.map((a) => {
    const text = readFileSync(join(FX, a.file), "utf8");
    const v = validateResumeContent(text);
    const shouldReject = a.idealExpectation === "reject";
    const correct = shouldReject ? !v.isResume : v.isResume;
    const row = { file: a.file, idealExpectation: a.idealExpectation || "accept", accepted: v.isResume, correct, reason: v.reason || undefined, note: a.note };
    if (shouldReject) (v.isResume ? fp : tn).push({ file: a.file, reason: v.reason || undefined, adversarial: true });
    else (v.isResume ? tp : fn).push({ file: a.file, reason: v.reason || undefined, adversarial: true });
    return row;
  });
  const total = tp.length + fn.length + fp.length + tn.length;
  results.suites.uploadGate = {
    description: "Resume-content gate: should accept real resumes, reject other documents (blocks junk uploads before a paid AI call).",
    positives: manifest.resumes.length + advAccept.length, negatives: manifest.nonResumes.length + advReject.length,
    positivesNote: `${manifest.resumes.length} core resumes + ${advAccept.length} adversarial accept cases; negatives include ${advReject.length} adversarial reject case(s)`,
    acceptedResumes: tp.length, falseRejections: fn,
    rejectedNonResumes: tn.length, falseAcceptances: fp,
    accuracy: +(((tp.length + tn.length) / total) * 100).toFixed(1),
    adversarialProbes: adv,
  };
}

// ---------- Suite 2: PDF text-extraction fidelity (unpdf path) ----------
{
  const rows = [];
  const pdfDir = join(FX, "pdf");
  for (const f of readdirSync(pdfDir).filter((x) => x.endsWith(".pdf"))) {
    const entry = manifest.resumes.find((r) => r.file.includes(f.replace(".pdf", "")));
    const src = readFileSync(join(FX, entry.file), "utf8");
    const buf = readFileSync(join(pdfDir, f));
    const file = new File([buf], f, { type: "application/pdf" });
    const extracted = await extractText(file);
    const lower = extracted.toLowerCase();
    const hits = entry.tokens.filter((t) => lower.includes(t.toLowerCase()));
    // word-level F1 vs source text
    const words = (s) => s.toLowerCase().split(/[^a-z0-9+.#]+/).filter((w) => w.length > 2);
    const srcWords = new Set(words(src));
    const extWords = new Set(words(extracted));
    const inter = [...srcWords].filter((w) => extWords.has(w)).length;
    const f1 = +(((2 * inter) / (srcWords.size + extWords.size)) * 100).toFixed(1);
    rows.push({ pdf: f, expectedTokens: entry.tokens.length, tokensRecovered: hits.length, missing: entry.tokens.filter((t) => !hits.includes(t)), wordF1: f1, extractedChars: extracted.length });
  }
  const n = rows.length;
  results.suites.pdfExtraction = {
    description: "unpdf text extraction on synthetic resume PDFs: expected-token recovery and word-level F1 vs source text.",
    pdfs: n,
    meanTokenRecovery: +(rows.reduce((s, r) => s + r.tokensRecovered / r.expectedTokens, 0) / n * 100).toFixed(1),
    meanWordF1: +(rows.reduce((s, r) => s + r.wordF1, 0) / n).toFixed(1),
    worst: rows.sort((a, b) => a.wordF1 - b.wordF1).slice(0, 3),
  };
}

// ---------- Suite 3: output-validator mutation testing ----------
{
  const baseline = JSON.parse(readFileSync(join(FX, "baseline-payload.json"), "utf8"));
  const cases = [
    ["baseline valid payload", () => {}, "accept"],
    ["verdict outside enum", (p) => { p.recruiterVerdict.verdict = "Interview"; }, "reject"],
    ["verdict missing", (p) => { delete p.recruiterVerdict.verdict; }, "reject"],
    ["confidence non-numeric", (p) => { p.recruiterVerdict.confidence = "high"; }, "reject"],
    ["confidence 150 -> clamp", (p) => { p.recruiterVerdict.confidence = 150; }, "accept", "clamped to 100 by design"],
    ["atsScore -20 -> clamp", (p) => { p.atsScore = -20; }, "accept", "clamped to 0 by design"],
    ["strongestSignal missing", (p) => { delete p.recruiterVerdict.strongestSignal; }, "reject"],
    ["reason empty string", (p) => { p.recruiterVerdict.reason = "   "; }, "reject"],
    ["careerGaps empty", (p) => { p.careerGaps = []; }, "reject"],
    ["roadmap empty", (p) => { p.roadmap = []; }, "reject"],
    ["careerGaps missing", (p) => { delete p.careerGaps; }, "reject"],
    ["skillMatch missing", (p) => { delete p.readinessBreakdown.skillMatch; }, "reject"],
    ["readinessBreakdown missing", (p) => { delete p.readinessBreakdown; }, "reject"],
    ["extra unknown fields", (p) => { p.futureField = { a: 1 }; }, "accept", "forward-compatible"],
    ["missingSkills not array", (p) => { p.missingSkills = "none"; }, "accept", "lenient: becomes []"],
    ["8 careerGaps -> sliced to 5", (p) => { p.careerGaps = Array(8).fill(p.careerGaps[0]); }, "accept"],
    ["estimatedWeeks 200 -> clamp 52", (p) => { p.careerGaps[0].estimatedWeeks = 200; }, "accept"],
    ["expectedReadinessAfter 500 -> clamp", (p) => { p.careerGaps[0].expectedReadinessAfter = 500; }, "accept"],
    ["payload null", () => null, "reject"],
    ["payload is array", () => [baseline], "reject"],
    ["roadmap week non-numeric", (p) => { p.roadmap[0].week = "two"; }, "accept", "defaults to 1"],
  ];
  const rows = [];
  for (const [name, mutate, expect, note] of cases) {
    let payload = structuredClone(baseline);
    const custom = mutate(payload);
    if (custom !== undefined) payload = custom;
    let accepted = false, error = null, normalized = null;
    try {
      const out = validateAnalysisPayload(payload);
      accepted = true;
      normalized = { atsScore: out.atsScore, confidence: out.recruiterVerdict.confidence, weeks: out.careerGaps[0]?.estimatedWeeks, gaps: out.careerGaps.length };
    } catch (e) { error = e.message; }
    rows.push({ name, expect, accepted, correct: (expect === "accept") === accepted, error, normalized, note });
  }
  const shouldReject = rows.filter((r) => r.expect === "reject");
  const shouldAccept = rows.filter((r) => r.expect === "accept");
  results.suites.outputValidator = {
    description: "Mutation testing of validateAnalysisPayload: structurally broken model outputs must be rejected; designed clamping/leniency must accept.",
    mutants: rows.length,
    shouldReject: shouldReject.length, caught: shouldReject.filter((r) => r.correct).length,
    catchRate: +(shouldReject.filter((r) => r.correct).length / shouldReject.length * 100).toFixed(1),
    shouldAccept: shouldAccept.length, falseRejections: shouldAccept.filter((r) => !r.correct).length,
    uncaught: rows.filter((r) => !r.correct),
  };
}

// ---------- Suite 4: prompt construction / truncation ----------
{
  const bigResume = "EXPERIENCE\n" + "Worked on systems. ".repeat(4000); // ~80k chars, valid resume words
  const bigJd = "Requirements: " + "many things. ".repeat(1000);
  const p1 = buildAnalysisPrompt(bigResume, "SDE", "Top Product", bigJd);
  const p2 = buildAnalysisPrompt("EDUCATION SKILLS PROJECTS short resume text", "PM", "Mass Recruiter");
  const truncations = (p1.match(/\[truncated for length\]/g) || []).length;
  results.suites.promptConstruction = {
    description: "buildAnalysisPrompt bounds: resume <= 12k chars, JD <= 6k chars, truncation marker, role/tier injected, JSON contract present.",
    resumeBounded: truncations >= 1,
    bothTruncated: truncations === 2,
    promptCharsOversizedInput: p1.length,
    roleInjected: p2.includes("**PM**") && p2.includes("**Mass Recruiter**"),
    jsonContractPresent: p2.includes('"recruiterVerdict"') && p2.includes('"roadmap"'),
    noTruncationOnSmallInput: !p2.includes("[truncated for length]"),
  };
}

writeFileSync(new URL("./results.json", import.meta.url), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
