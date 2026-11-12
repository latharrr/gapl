import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/app/api/webhooks/resend/route.ts", import.meta.url), "utf8");

test("unknown Resend event types are acknowledged and ignored, not mapped to sent", () => {
  assert.match(src, /EVENT_MAP: Record<string, \{ status: string; logType: string \}>/);
  assert.match(src, /if \(!mapped\) \{\s*return NextResponse\.json\(\{ success: true, ignored: eventType \}\)/);
  // The ignore path must run before any status update or event log write.
  assert.ok(src.indexOf("ignored: eventType") < src.indexOf("msgDoc.ref.update"));
  assert.ok(src.indexOf("ignored: eventType") < src.indexOf('collection("email_events")'));
  // No default-to-sent fallthrough may remain.
  assert.ok(!src.includes('let newStatus = "sent"'));
});

test("a late lower-rank event never overwrites a further-along status", () => {
  assert.match(src, /STATUS_RANK: Record<string, number> = \{ sent: 1, delivered: 2, opened: 3, clicked: 4 \}/);
  assert.match(src, /TERMINAL_STATUSES = new Set\(\["bounced", "complained", "failed", "unsubscribed"\]\)/);
  assert.match(src, /!TERMINAL_STATUSES\.has\(newStatus\)/);
  assert.match(src, /if \(!isRegression\) \{\s*updatePayload\.status = newStatus;/);
});

test("duplicate deliveries are rejected atomically, not by get-then-set", () => {
  assert.match(src, /webhookEventRef\.create\(/);
  assert.match(src, /code\?: number \}\)\?\.code === 6/);
  assert.ok(!src.includes("eventSnap"), "old non-atomic get() check must be gone");
});

test("first-open and first-click timestamps remain write-once", () => {
  assert.match(src, /msgData\.openedAt \|\| timestamp/);
  assert.match(src, /msgData\.clickedAt \|\| timestamp/);
});
