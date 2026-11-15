import test from "node:test";
import assert from "node:assert/strict";
import { cleanTimes, fillTastingLinks, isWedding, pickProblem, shouldCancelTastings, tastingView, tastingsToRemind } from "./tasting.js";
import { DEFAULT_TASTING, renderTastingEmail, tastingLength, tastingWhen } from "./replyText.js";

const now = Date.parse("2026-11-14T18:00:00Z");

test("offered times: future only, no repeats, in order", () => {
  assert.deepEqual(
    cleanTimes(["2026-11-19T02:00:00.000Z", "2026-11-18T02:00:00.000Z", "2026-11-18T02:00:00Z", "2026-11-10T02:00:00Z", "nope", ""], now),
    ["2026-11-18T02:00:00.000Z", "2026-11-19T02:00:00.000Z"]
  );
  assert.deepEqual(cleanTimes(undefined, now), []);
});

test("each tasting button gets its own link", () => {
  const out = fillTastingLinks('<a href="{{TASTING_0}}">A</a><a href="{{TASTING_1}}">B</a> {{TASTING_0}}', "abc123", 2);
  assert.equal(out, '<a href="https://backyardbrickovenpizza.com/tasting?t=abc123&i=0">A</a><a href="https://backyardbrickovenpizza.com/tasting?t=abc123&i=1">B</a> https://backyardbrickovenpizza.com/tasting?t=abc123&i=0');
  assert.equal(fillTastingLinks("no times", "", 0), "no times");
});

test("Utah time words", () => {
  assert.equal(tastingWhen("2026-11-18T02:00:00Z"), "Tuesday, November 17 at 7:00 pm");
  assert.equal(tastingWhen("2026-11-18T02:30:00Z", { short: true }), "Tue, Nov 17 · 7:30 pm");
  assert.equal(tastingWhen("2027-06-02T01:00:00Z"), "Tuesday, June 1 at 7:00 pm"); // summer time
  assert.equal(tastingLength(60), "about an hour");
  assert.equal(tastingLength(45), "about 45 minutes");
  assert.equal(tastingLength(90), "about 1 hour 30 minutes");
});

test("confirmation email", () => {
  const mail = renderTastingEmail(DEFAULT_TASTING.confirm, { name: "Kate and Ryan", at: "2026-11-18T02:00:00Z", place: "123 Test St, Bountiful, UT", minutes: 60 });
  assert.equal(mail.subject, "Your pizza tasting is set! 🍕");
  assert.match(mail.text, /^Hi Kate and Ryan,/);
  assert.match(mail.text, /You're all set for a pizza tasting on Tuesday, November 17 at 7:00 pm\./);
  assert.match(mail.text, /Where: 123 Test St, Bountiful, UT\nIt takes about an hour\./);
  assert.match(mail.html, /<p>Where: 123 Test St, Bountiful, UT<br>It takes about an hour\.<\/p>/);
  const noPlace = renderTastingEmail(DEFAULT_TASTING.confirm, { name: "Sam", at: "2026-11-18T02:00:00Z", place: "", minutes: 60 });
  assert.match(noPlace.text, /Where: \(we'll send the address\)/);
});

test("reminders go out the day before, once", () => {
  const morning = new Date("2026-11-16T16:00:00Z"); // Mon 9 am Utah
  const docs = [
    { t: { picked: "2026-11-18T02:00:00Z" } }, // Tue 7 pm Utah: tomorrow
    { t: { picked: "2026-11-18T02:00:00Z", reminderSent: 1 } },
    { t: { picked: "2026-11-19T02:00:00Z" } }, // Wed: not yet
    { t: {} },
  ];
  assert.deepEqual(tastingsToRemind(docs, morning), [docs[0]]);
});

test("free tastings are for weddings only", () => {
  assert.equal(isWedding({ eventType: "Wedding" }), true);
  assert.equal(isWedding({ eventType: "Wedding reception" }), true);
  assert.equal(isWedding({ eventType: "Birthday or family party" }), false);
  assert.equal(isWedding({ eventType: "" }), false);
  assert.equal(isWedding(null), false);
});

test("lost or deleted events cancel their tastings", () => {
  assert.equal(shouldCancelTastings({ status: "quoted" }, { status: "lost" }), true);
  assert.equal(shouldCancelTastings({ status: "booked" }, null), true); // deleted
  assert.equal(shouldCancelTastings({ status: "lost" }, { status: "lost" }), false); // already lost
  assert.equal(shouldCancelTastings({ status: "quoted" }, { status: "booked" }), false);
  assert.equal(shouldCancelTastings(null, { status: "lost" }), false); // created as lost: nothing offered
});

test("a cancelled tasting: page says so, no picking, no reminder", () => {
  const t = { name: "Kate and Ryan", times: ["2026-11-18T02:00:00.000Z"], picked: "2026-11-18T02:00:00.000Z", cancelled: true, minutes: 60 };
  assert.deepEqual(tastingView(t, now), { name: "Kate and Ryan", picked: null, cancelled: true, minutes: 60, times: [] });
  assert.match(pickProblem(t, "2026-11-18T02:00:00.000Z", now), /isn't scheduled anymore/);
  assert.equal(pickProblem({ times: ["2026-11-18T02:00:00.000Z"] }, "2026-11-18T02:00:00.000Z", now), "");
  assert.match(pickProblem({ times: ["2026-11-18T02:00:00.000Z"] }, "2026-11-19T02:00:00.000Z", now), /isn't available anymore/);
  const morning = new Date("2026-11-16T16:00:00Z");
  assert.deepEqual(tastingsToRemind([{ t }], morning), []);
  assert.equal(tastingView({ ...t, cancelled: false }, now).picked, "2026-11-18T02:00:00.000Z");
});
