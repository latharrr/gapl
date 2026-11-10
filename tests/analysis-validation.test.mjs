import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("analyze route validates AI output inside the refund path", () => {
  const route = read("src/app/api/analyze/route.ts");
  assert.match(route, /validateAnalysisPayload\(parsed\)/);
  // Validation must run before the credit is released, so a bad payload refunds it.
  assert.ok(route.indexOf("validateAnalysisPayload(parsed)") < route.indexOf("releaseAnalysis(user.uid)"));
});

test("validator rejects verdicts outside the known set", () => {
  const v = read("src/lib/analysis-validation.ts");
  assert.match(v, /\["Shortlist", "Maybe", "Reject"\]/);
  assert.match(v, /invalid recruiter verdict/);
});

test("validator clamps scores to 0-100 and rejects non-numeric scores", () => {
  const v = read("src/lib/analysis-validation.ts");
  assert.match(v, /Number\.isFinite\(parsed\)/);
  assert.match(v, /Math\.min\(100, Math\.max\(0, Math\.round\(parsed\)\)\)/);
});

test("validator refuses a payload with no gaps or no roadmap", () => {
  const v = read("src/lib/analysis-validation.ts");
  assert.match(v, /careerGaps\.length === 0 \|\| roadmap\.length === 0/);
});

test("validator covers every verdict and breakdown field the report page reads", () => {
  const v = read("src/lib/analysis-validation.ts");
  for (const key of ["confidence", "reason", "strongestSignal", "topGap", "whatWouldChangeDecision"]) {
    assert.match(v, new RegExp(`${key}:`), key);
  }
  for (const key of ["skillMatch", "projectComplexity", "deploymentEvidence", "teamCollaboration"]) {
    assert.match(v, new RegExp(`component\\("${key}"\\)`), key);
  }
});

test("roadmap PATCH keeps a real 0 readiness instead of falling back", () => {
  const route = read("src/app/api/roadmaps/[id]/route.ts");
  // The correct pattern is a typeof check; `|| 65` would silently erase a valid 0.
  assert.match(route, /typeof report\.readiness === "number" \? report\.readiness : 65/);
  assert.doesNotMatch(route, /startReadiness = .*readiness \|\| 65/);
});
