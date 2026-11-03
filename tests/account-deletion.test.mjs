import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/lib/user-deletion.ts", import.meta.url), "utf8");

// Every collection that stores a per-user `userId` must be wiped on account
// deletion. email_events holds recipient addresses, IPs and user agents;
// trackable_links holds the user's link-click history.
for (const collection of ["reports", "ai_calls", "payments", "payment_orders", "analytics_events", "email_messages", "email_events", "trackable_links", "cvs"]) {
  test(`account deletion removes ${collection}`, () => {
    const list = source.match(/collectionsWithUserId = \[([\s\S]*?)\]/);
    assert.ok(list, "collectionsWithUserId list not found");
    assert.match(list[1], new RegExp(`"${collection}"`));
  });
}
