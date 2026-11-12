import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

// The readonly role exists to give view-only admin access. requireAdmin admits it,
// so every mutating admin route must reject it (and support) with its own check.
const MUTATING_ROUTES = [
  ["src/app/api/admin/emails/send/route.ts", "sendEmail("],
  ["src/app/api/admin/users/send-email/route.ts", "sendEmail("],
  ["src/app/api/admin/emails/rewrite/route.ts", "generateAICall("],
  ["src/app/api/admin/links/route.ts", "createTrackableLink("],
];

for (const [path, mutation] of MUTATING_ROUTES) {
  test(`${path} blocks readonly/support before mutating`, () => {
    const src = read(path);
    assert.match(src, /\["super_admin", "admin"\]\.includes\(adminUser\.role\)/, "role check missing");
    assert.match(src, /Unauthorized role[\s\S]{0,80}status: 403/, "403 missing");
    const checkAt = src.indexOf('includes(adminUser.role)');
    const mutateAt = src.indexOf(mutation);
    assert.ok(checkAt > -1 && mutateAt > -1 && checkAt < mutateAt, "role check must run before the mutation");
  });
}

test("readonly remains a view-only member of the admin role set", () => {
  const auth = read("src/lib/firebase-admin.ts");
  assert.match(auth, /"super_admin", "admin", "support", "readonly"/);
});

test("existing RBAC checks on users, payments and prompts stay in place", () => {
  assert.match(read("src/app/api/admin/users/route.ts"), /Only super_admin can change credit balances/);
  assert.match(read("src/app/api/admin/users/route.ts"), /Only super_admin can modify user roles/);
  assert.match(read("src/app/api/admin/payments/route.ts"), /adminUser\.role !== "super_admin"/);
  assert.match(read("src/app/api/admin/prompts/route.ts"), /Unauthorized role for prompt modification/);
});
