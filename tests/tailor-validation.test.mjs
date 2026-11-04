import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("tailor route validates the AI output before returning it", () => {
  const route = read("src/app/api/tailor/route.ts");
  assert.match(route, /validateTailoredResume\(parsed\)/);
  // The call sits inside the try that refunds the credit on failure.
  assert.ok(route.indexOf("validateTailoredResume(parsed)") < route.indexOf("releaseAnalysis(user.uid)"));
});

test("tailor route rejects non-text inputs with a 400", () => {
  const route = read("src/app/api/tailor/route.ts");
  assert.match(route, /typeof resumeText !== "string"[\s\S]{0,300}status: 400/);
});

test("validator fills every list the tailor page maps over", () => {
  const v = read("src/lib/tailor-validation.ts");
  for (const key of ["education", "skills", "experience", "projects", "activities", "changes", "keywordsAdded"]) {
    assert.match(v, new RegExp(`${key}:`), key);
  }
  assert.match(v, /missing a name/);
  assert.match(v, /invalid \$\{label\}/);
});
