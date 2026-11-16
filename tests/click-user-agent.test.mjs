import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// The parser lives inside a route file (routes cannot export helpers), so run its source directly.
const src = readFileSync(new URL("../src/app/api/t/[id]/route.ts", import.meta.url), "utf8");
const body = src.slice(src.indexOf("function parseUserAgent"), src.indexOf("export async function GET")).replace("ua: string", "ua");
const parseUserAgent = new Function(`${body}; return parseUserAgent;`)();

const CASES = [
  ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1", "Safari", "iOS", "Mobile"],
  ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0", "Edge", "Windows", "Desktop"],
  ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 OPR/112.0.0.0", "Opera", "Windows", "Desktop"],
  ["Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36", "Chrome", "Android", "Mobile"],
  ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15", "Safari", "macOS", "Desktop"],
];

for (const [ua, browser, os, device] of CASES) {
  test(`click tracker reads ${browser} on ${os}`, () => {
    assert.deepEqual(parseUserAgent(ua), { browser, os, device });
  });
}
