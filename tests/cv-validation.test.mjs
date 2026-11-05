import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("cv-builder route validates AI output inside the refund path", () => {
  const route = read("src/app/api/cv-builder/route.ts");
  assert.match(route, /validateCvResult\(parsed\)/);
  assert.ok(route.indexOf("validateCvResult(parsed)") < route.indexOf("releaseAnalysis(user.uid)"));
});

test("cv-builder JSON path rejects non-text fields with a 400", () => {
  const route = read("src/app/api/cv-builder/route.ts");
  assert.match(route, /typeof v !== "string"[\s\S]{0,200}status: 400/);
});

test("validator covers every field the CV page reads", () => {
  const v = read("src/lib/cv-validation.ts");
  for (const key of ["education", "skills", "experience", "projects", "activities", "atsScore", "originalAtsScore", "keywordsInjected", "bulletsImproved", "topWin"]) {
    assert.match(v, new RegExp(`${key}:`), key);
  }
  assert.match(v, /missing a name/);
});
