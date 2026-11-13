# Gapl evaluation report — 14 Nov 2026

First behavioral evaluation of the Gapl analysis pipeline. Source: github.com/latharrr/gapl @ commit 7f71a56 (12 Nov 2026, "Merge pull request #12 from latharrr/fix/admin-rbac-write-routes").
All fixtures synthetic and deterministic (seed 20261114). No API keys, no network, no paid inference for the four executed suites.
Reproduce: node evals/fixtures.mjs && python3 evals/gen_pdfs.py && npx tsx evals/run.mjs (from repo root; needs Node 22, Python + reportlab, npm i -D tsx unpdf).

The upload-gate bug this evaluation exposed is fixed in this commit; Suite 1 shows before/after. The adversarial fixtures stay in the suite as a regression guard.

## Results

| Suite | What it measures | Set size | Result |
|---|---|---|---|
| 1. Upload gate | validateResumeContent accepts resumes, rejects other documents before a paid AI call | 27 resumes + 17 non-resumes = 44 docs (incl. 4 adversarial cases) | Before fix: 24/27 resumes accepted, 17/17 non-resumes rejected → 41/44 = 93.2%; all 3 misses were real resumes with billing/restaurant project work, no junk got through. After fix: 27/27 + 17/17 → 44/44 |
| 2. PDF extraction | unpdf text fidelity on generated resume PDFs (expected-token recovery, word-level F1 vs source) | 24 PDFs | 100% expected-token recovery; 97.9% mean word-F1 (worst: 95.1) |
| 3. Output validator | validateAnalysisPayload rejects structurally broken AI outputs; honors designed clamping/leniency | 21 mutants | 12/12 invalid outputs rejected, 9/9 valid-by-design accepted, 0 false rejections |
| 4. Prompt construction | buildAnalysisPrompt bounds (12k resume / 6k JD truncation, role/tier injection, JSON contract) | 6 checks | 6/6 pass |

Total: 95 executed checks.

## Bug found by the eval (fixed in this commit)

A genuine resume whose projects are an "invoice generator" and a "receipt parser" was rejected by the upload gate. Its negative-keyword rule (≥2 of invoice, receipt, …) fired before resume signals were counted, so the 15+ resume signals present were never seen. Any candidate with billing/payments project work could hit this.

Fix: negative keywords now reject only when resume structure is also weak (<5 of the 22 resume signals); documents with fewer than 3 signals still reject as not-a-resume. Fixture data justified the threshold: real resumes carry 9-15 signals, junk documents carry 0. See FIX_REPORT.txt for the full before/after. The three adversarial accept fixtures and the keyword-stuffed invoice stay in the suite so a regression fails the run.

## Limits — read before citing numbers

- Fixtures are author-built synthetics, not independently sourced resumes. Suite scores mean "passes its own labeled fixture suite", not field accuracy on arbitrary uploads. The gate's 44/44 after the fix is a synthetic-suite result, not a real-world accuracy claim.
- Suites 1–4 cover pipeline guardrails and determinism. They say nothing about model verdict quality (whether Shortlist/Maybe/Reject matches human judgment).
- The repo's existing suite (50 tests, all passing) asserts regex patterns against source text rather than executing behavior; the suites above execute the real functions.

## Not run — live model-quality evaluation

A 30-case protocol is prepared (8 archetypes × 3 quality tiers = 24 matched-role, + 6 role-mismatched) in evals/model-eval-fixtures.json. It uses a preliminary synthetic rubric: verdict bands and score-monotonicity expectations are derived from how these fixtures were constructed, and need independent review before any results could be cited. Live model-quality evaluation not run; requires a separately approved inference budget.
