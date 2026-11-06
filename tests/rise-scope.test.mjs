import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

// [data-rise] elements are revealed by GSAP inside SmoothScroll only. Pages that
// render those components without SmoothScroll (/pricing) must not hide them.

test("the data-rise hiding rule only applies inside a SmoothScroll scope", () => {
  const css = read("src/app/globals.css");
  assert.match(css, /\.js \.rise-scope \[data-rise\] \{ opacity: 0; \}/);
  assert.doesNotMatch(css, /\.js \[data-rise\] \{ opacity: 0/);
});

test("SmoothScroll marks its content as the reveal scope", () => {
  const component = read("src/components/motion/SmoothScroll.tsx");
  assert.match(component, /className="rise-scope"/);
});

test("reduced motion still shows scoped data-rise content", () => {
  const css = read("src/app/globals.css");
  assert.match(css, /prefers-reduced-motion: reduce\) \{ \.js \.rise-scope \[data-rise\] \{ opacity: 1/);
});
