import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CREDIT_PACKS, FREE_SIGNUP_CREDITS, creditBalance, getPack, initialCreditsFor, pricePerCredit } from "../src/lib/plans.ts";

test("packs match the agreed price list", () => {
  assert.deepEqual(
    CREDIT_PACKS.map(({ id, credits, priceInr }) => [id, credits, priceInr]),
    [["starter", 4, 99], ["plus", 10, 199], ["pro", 20, 349]],
  );
});

test("each bigger pack is cheaper per credit", () => {
  const perCredit = CREDIT_PACKS.map(pricePerCredit);
  for (let i = 1; i < perCredit.length; i++) assert.ok(perCredit[i] < perCredit[i - 1]);
});

test("getPack accepts known ids only", () => {
  assert.equal(getPack(" PLUS ")?.credits, 10);
  assert.equal(getPack("basic"), null);
  assert.equal(getPack("free"), null);
  assert.equal(getPack(undefined), null);
  assert.equal(getPack(149), null);
});

test("new and untouched accounts get exactly one free credit", () => {
  assert.equal(FREE_SIGNUP_CREDITS, 1);
  assert.equal(initialCreditsFor({ plan: "free", analysisCount: 0 }), 1);
  assert.equal(initialCreditsFor({}), 1);
});

test("free accounts that already analysed get no backfilled credit", () => {
  assert.equal(initialCreditsFor({ plan: "free", analysisCount: 1 }), 0);
});

test("legacy monthly buyers keep one month of their plan as credits", () => {
  assert.equal(initialCreditsFor({ plan: "basic" }), 5);
  assert.equal(initialCreditsFor({ plan: "PRO", analysisCount: 7 }), 20);
  assert.equal(initialCreditsFor({ plan: "premium" }), 50);
});

test("a stored balance wins over the backfill and is never negative or fractional", () => {
  assert.equal(creditBalance({ credits: 0, plan: "premium" }), 0);
  assert.equal(creditBalance({ credits: 7.9 }), 7);
  assert.equal(creditBalance({ credits: -3 }), 0);
  assert.equal(creditBalance({ credits: Number.NaN, analysisCount: 0 }), 1);
});

// The browser must never be able to mint its own profile (and so its own balance).
test("firestore rules deny client-side profile creation and credit edits", () => {
  const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
  const users = rules.slice(rules.indexOf("match /users/{userId}"), rules.indexOf("match /reports/"));
  assert.match(users, /allow create: if false;/);
  assert.match(users, /hasOnly\(\["displayName", "photoURL", "updatedAt"\]\)/);
});
