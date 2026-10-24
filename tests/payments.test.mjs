import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("credits are granted in one shared, idempotent place", () => {
  const payments = read("src/lib/payments.ts");
  assert.match(payments, /status === "captured" \|\| current\.status === "verified" \|\| current\.status === "refunded"/);
  assert.match(payments, /credits: balance \+ pack\.credits/);
  for (const route of ["src/app/api/payment/verify/route.ts", "src/app/api/payment/webhook/route.ts"]) {
    const source = read(route);
    assert.match(source, /applyCapturedPayment\(/, route);
    assert.doesNotMatch(source, /transaction\.set\(userRef/, route);
  }
});

test("the webhook acknowledges orders that aren't ours instead of failing", () => {
  const webhook = read("src/app/api/payment/webhook/route.ts");
  assert.match(webhook, /err instanceof PaymentMismatchError[\s\S]*received: true/);
});

test("the order route charges the pack price from the server, not the client", () => {
  const order = read("src/app/api/payment/order/route.ts");
  assert.match(order, /const amount = pack\.priceInr;/);
  assert.match(order, /getPack\(body\.pack\)/);
});

test("admin refunds go through Razorpay before credits are removed", () => {
  const admin = read("src/app/api/admin/payments/route.ts");
  assert.ok(admin.indexOf("razorpay.payments.refund(") < admin.indexOf("refunded: true"));
});

test("unsigned Resend webhooks are refused in production", () => {
  const resend = read("src/app/api/webhooks/resend/route.ts");
  assert.match(resend, /process\.env\.NODE_ENV === "production"[\s\S]{0,400}status: 503/);
});
