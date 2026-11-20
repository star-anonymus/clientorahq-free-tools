// The feedback step (lib/feedback.ts): what is sent, the pending question, and visible errors. Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { feedbackBody, gate, getPending, sendFeedback, setGateHandler, setPending } from "../lib/feedback.ts";

const p = { tool: "merge-pdf", name: "Merge PDF", page: "/merge-pdf", at: Date.now() };

test("the body holds only the tool, site, page, rating and comment", () => {
  assert.deepEqual(feedbackBody(p, "4", "  nice  "), { topic: "tool", tool: "merge-pdf", site: "tools", page: "/merge-pdf", rating: "4", comment: "nice", website: "", cq_hp: "" });
  assert.equal(feedbackBody(p, "skip", "ignored").comment, "", "a skip carries no comment");
  assert.equal(feedbackBody(p, "5", "x".repeat(2000)).comment.length, 1000);
});

test("a pending question is kept (even without storage) and expires after a day", () => {
  setPending(p);
  assert.equal(getPending()?.tool, "merge-pdf");
  assert.equal(getPending(p.at + 25 * 3600 * 1000), null);
  setPending(null);
  assert.equal(getPending(), null);
});

test("gate runs the next step at once with nothing pending, and waits when the host says so", () => {
  let ran = 0;
  gate(() => ran++);
  assert.equal(ran, 1, "no host: runs");
  let held;
  setGateHandler((next) => { held = next; return false; });
  gate(() => ran++);
  assert.equal(ran, 1, "held until answered");
  held?.();
  assert.equal(ran, 2);
  setGateHandler(null);
});

test("a failed send throws a message to show with Retry", async () => {
  await sendFeedback(p, "5", "", (async () => new Response("{}", { status: 200 })));
  await assert.rejects(sendFeedback(p, "5", "", (async () => { throw new TypeError("offline"); })), /check your internet and press Retry/);
  await assert.rejects(sendFeedback(p, "5", "", (async () => Response.json({ error: "Too much feedback" }, { status: 429 }))), /Too much feedback/);
  await assert.rejects(sendFeedback(p, "5", "", (async () => new Response("oops", { status: 500 }))), /press Retry/);
});
