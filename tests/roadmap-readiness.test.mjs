import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/app/api/roadmaps/[id]/route.ts", import.meta.url), "utf8");

// Scores are numbers that can legitimately be 0. `x || fallback` would turn a
// real 0 readiness into 65/85; the route must only fall back when absent.

test("roadmap readiness never falls back on a real zero score", () => {
  assert.doesNotMatch(source, /readiness \|\| /);
  assert.doesNotMatch(source, /expectedReadinessAfter \|\| /);
  assert.match(source, /typeof v === "number" && Number\.isFinite\(v\)/);
});
