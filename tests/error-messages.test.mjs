import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

// User-facing API routes must not return raw internal error messages on 500s.
// Internal messages can carry Firestore paths, provider details or keys; the
// detail belongs in server logs, the client gets a fixed generic message.
const USER_FACING_ROUTES = [
  "src/app/api/tailor/route.ts",
  "src/app/api/cv-builder/route.ts",
  "src/app/api/cv-builder/email/route.ts",
  "src/app/api/reports/[id]/email/route.ts",
  "src/app/api/analyze/validate/route.ts",
  "src/app/api/webhooks/resend/route.ts",
];

const LEAK_PATTERNS = [
  /\?\s*err\.message\s*:/, // err instanceof Error ? err.message : "..."
  /err\s+instanceof\s+Error\s+&&\s+err\.message/, // const message = err && err.message ? ...
  /error\?\.message\s*\|\|/, // error?.message || "..."
];

for (const route of USER_FACING_ROUTES) {
  test(`${route} never returns raw internal error messages`, () => {
    const responseLines = read(route)
      .split("\n")
      .filter((line) => !line.includes("console.")); // server-side logging is the right place for detail
    for (const line of responseLines) {
      for (const pattern of LEAK_PATTERNS) {
        assert.ok(!pattern.test(line), `${route} leaks via: ${line.trim()}`);
      }
    }
  });
}

test("tailor and cv-builder still return the safe UsageLimitError message", () => {
  for (const route of ["src/app/api/tailor/route.ts", "src/app/api/cv-builder/route.ts"]) {
    const source = read(route);
    assert.ok(source.includes('code: "LIMIT_REACHED"'), `${route} keeps the out-of-credits response`);
  }
});

test("500 responses keep a fixed generic client message", () => {
  const expectations = {
    "src/app/api/tailor/route.ts": "Tailoring failed. Please try again.",
    "src/app/api/cv-builder/route.ts": "CV generation failed. Please try again.",
    "src/app/api/cv-builder/email/route.ts": "Failed to send email.",
    "src/app/api/reports/[id]/email/route.ts": "Failed to send email.",
    "src/app/api/analyze/validate/route.ts": "Failed to validate resume.",
    "src/app/api/webhooks/resend/route.ts": "Failed to process webhook.",
  };
  for (const [route, message] of Object.entries(expectations)) {
    assert.ok(read(route).includes(`{ error: "${message}" }`), `${route} returns "${message}"`);
  }
});
