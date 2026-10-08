import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../src/app/api/analyze/route.ts", import.meta.url),
  "utf8",
);

// A valid score of 0 must reach the report-ready email as 0, so the fallback
// has to be nullish coalescing (??), not logical OR (||).
test("report-ready email keeps a valid score of 0", () => {
  assert.match(source, /safePayload\.atsScore \?\? 70/);
  assert.match(source, /safePayload\.readiness \?\? 65/);
  assert.doesNotMatch(source, /safePayload\.atsScore \|\| 70/);
  assert.doesNotMatch(source, /safePayload\.readiness \|\| 65/);
});
