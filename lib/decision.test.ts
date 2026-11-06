import assert from "node:assert/strict";
import { test } from "node:test";
import { jobById } from "./jobs";
import { verifyToken } from "./permit";
import { openCheckout, releaseHold, settle } from "./settle";

test("an even split adds up and still does not get paid", () => {
  const job = jobById("trip-split");
  assert.ok(job);
  const result = settle({ jobId: job.id, deliverable: job.rushed });
  assert.equal(result.final, "refuse");
  assert.equal(result.permit, null);
  assert.equal(result.checks.find((check) => check.id === "sum")?.pass, true);
  assert.equal(result.checks.find((check) => check.id === "alex")?.pass, false);
  assert.match(result.explanation, /PayPal was not called/);
});

test("the agreed split releases the posted bounty, not the dinner bill", () => {
  const job = jobById("trip-split");
  assert.ok(job);
  const result = settle({ jobId: job.id, deliverable: job.careful });
  assert.equal(result.final, "release");
  assert.equal(result.bounty, "18.00");
  assert.notEqual(result.bounty, "96.00");
  const claims = verifyToken(result.permit ?? "");
  assert.equal(claims?.amount, "18.00");
  assert.equal(claims?.jobId, "trip-split");
  const gate = openCheckout(result.permit ?? "", result.deliverable);
  assert.ok("claims" in gate);
});

test("a generous reviewer cannot pay a failed check", () => {
  const job = jobById("trip-split");
  assert.ok(job);
  const result = settle({
    jobId: job.id,
    deliverable: job.rushed,
    review: { release: true, summary: "Ship it.", source: "model" },
  });
  assert.equal(result.review.release, true);
  assert.equal(result.kernel, "refuse");
  assert.equal(result.final, "refuse");
  assert.equal(result.permit, null);
  assert.match(result.explanation, /reviewer approved/i);
});

test("forcing the reviewer to approve the even split still refuses", () => {
  const job = jobById("trip-split");
  assert.ok(job);
  const result = settle({ jobId: job.id, deliverable: job.rushed, forceReviewer: true });
  assert.equal(result.review.source, "forced");
  assert.equal(result.permit, null);
});

test("a signed permit dies if the deliverable is swapped", () => {
  const job = jobById("trip-split");
  assert.ok(job);
  const result = settle({ jobId: job.id, deliverable: job.careful });
  const gate = openCheckout(result.permit ?? "", job.rushed);
  assert.ok("error" in gate);
  const flipped = `${result.permit?.slice(0, -1)}${result.permit?.endsWith("a") ? "b" : "a"}`;
  assert.equal(verifyToken(flipped), null);
});

test("the client can release a hold, and cannot pay past a failed check", () => {
  const job = jobById("trip-split");
  assert.ok(job);
  const held = settle({
    jobId: job.id,
    deliverable: job.careful,
    review: { release: false, summary: "I want another pass.", source: "model" },
  });
  assert.equal(held.final, "hold");
  assert.equal(held.permit, null);
  const released = releaseHold(job.id, job.careful);
  assert.equal(released.final, "release");
  assert.equal(released.bounty, "18.00");
  assert.throws(() => releaseHold(job.id, job.rushed), /failed check/);
});

test("a shortened ledger and a doubled refund never open checkout", () => {
  const ledger = jobById("expense-close");
  const letter = jobById("refund-letter");
  assert.ok(ledger && letter);
  const badLedger = settle({ jobId: ledger.id, deliverable: ledger.rushed });
  const goodLedger = settle({ jobId: ledger.id, deliverable: ledger.careful });
  const badLetter = settle({ jobId: letter.id, deliverable: letter.rushed });
  const goodLetter = settle({ jobId: letter.id, deliverable: letter.careful });
  assert.equal(badLedger.final, "refuse");
  assert.equal(badLedger.checks.find((check) => check.id === "icons")?.pass, false);
  assert.equal(goodLedger.bounty, "24.00");
  assert.equal(goodLedger.final, "release");
  assert.equal(badLetter.final, "refuse");
  assert.equal(badLetter.checks.find((check) => check.id === "double-amount")?.pass, false);
  assert.equal(goodLetter.bounty, "12.00");
  assert.equal(goodLetter.final, "release");
  assert.notEqual(goodLetter.bounty, "48.00");
});
