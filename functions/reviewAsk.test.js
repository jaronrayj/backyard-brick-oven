import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { reviewEmail, reviewEventWords, reviewGreetingName, reviewSendDate, reviewState } from "./reviewAskText.js";
import { reviewAsksDue } from "./reviewAsk.js";

test("the Events page preview uses the same text as the email", () => {
  const here = readFileSync(new URL("./reviewAskText.js", import.meta.url), "utf8");
  const site = readFileSync(new URL("../src/pages/Events/reviewAskText.js", import.meta.url), "utf8");
  assert.equal(site, here, "copy functions/reviewAskText.js to src/pages/Events/reviewAskText.js");
});

test("greeting: first name, couples whole, otherwise 'there'", () => {
  assert.equal(reviewGreetingName("Emma Shannon"), "Emma");
  assert.equal(reviewGreetingName("Becca Jenkins"), "Becca");
  assert.equal(reviewGreetingName("Taylar Dilley"), "Taylar");
  assert.equal(reviewGreetingName("Jess and Austin"), "Jess and Austin");
  assert.equal(reviewGreetingName("Jess & Austin"), "Jess & Austin");
  assert.equal(reviewGreetingName("  Sarah   "), "Sarah");
  assert.equal(reviewGreetingName("Smith wedding"), "there");
  assert.equal(reviewGreetingName("Acme Corp"), "there");
  assert.equal(reviewGreetingName("Bountiful 4th Ward"), "there");
  assert.equal(reviewGreetingName("Test quote"), "Test");
  assert.equal(reviewGreetingName(""), "there");
  assert.equal(reviewGreetingName(undefined), "there");
});

test("event words: weddings by name, everything else 'your event'", () => {
  assert.equal(reviewEventWords("Wedding"), "your wedding");
  assert.equal(reviewEventWords("Birthday or family party"), "your event");
  assert.equal(reviewEventWords(""), "your event");
});

test("send date is the day after, across month and year ends", () => {
  assert.equal(reviewSendDate("2027-04-17"), "2027-04-18");
  assert.equal(reviewSendDate("2026-11-30"), "2026-12-01");
  assert.equal(reviewSendDate("2026-12-31"), "2027-01-01");
  assert.equal(reviewSendDate(""), "");
});

test("state follows status, email, skip and sent", () => {
  const base = { status: "booked", email: "a@b.com", date: "2027-04-17" };
  assert.equal(reviewState(base), "waiting");
  assert.equal(reviewState({ ...base, status: "done" }), "waiting");
  assert.equal(reviewState({ ...base, status: "quoted" }), "notBooked");
  assert.equal(reviewState({ ...base, status: "lost" }), "notBooked");
  assert.equal(reviewState({ ...base, email: "" }), "noEmail");
  assert.equal(reviewState({ ...base, reviewAskSkip: true }), "skipped");
  assert.equal(reviewState({ ...base, reviewAsk: { sentAt: 1 } }), "sent");
});

test("email for Jess and Austin's wedding", () => {
  const mail = reviewEmail({ name: "Jess and Austin", eventType: "Wedding", email: "jess@example.com" });
  assert.equal(mail.to, "jess@example.com");
  assert.equal(mail.subject, "Thanks for having us!");
  assert.match(mail.text, /^Hi Jess and Austin,/);
  assert.match(mail.text, /at your wedding! We loved cooking for you and your guests and we hope it was everything you wanted\./);
  assert.match(mail.text, /backyardbrickovenpizza\.com\/review/);
  assert.match(mail.html, /Leave us a review/);
  assert.doesNotMatch(mail.text + mail.html, /wood/i);
});

test("email for a party says 'your event' and escapes the name", () => {
  const mail = reviewEmail({ name: "Kim <b>", eventType: "Birthday or family party", email: "Kim <kim@example.com>" });
  assert.equal(mail.to, "kim@example.com");
  assert.match(mail.text, /at your event! We loved cooking for you and your guests\./);
  assert.doesNotMatch(mail.html, /<b>,/);
});

test("due: the morning after, a short catch-up, never old events, once", () => {
  const ev = (over) => ({ id: over.id || "x", event: { status: "booked", email: "a@b.com", name: "Sam Lee", ...over } });
  const today = "2026-11-21";
  const due = reviewAsksDue(
    [
      ev({ id: "yesterday", date: "2026-11-20" }),
      ev({ id: "today", date: "2026-11-21" }),
      ev({ id: "tomorrow", date: "2026-11-22" }),
      ev({ id: "missed2", date: "2026-11-18" }),
      ev({ id: "tooOld", date: "2026-11-10" }),
      ev({ id: "sent", date: "2026-11-20", reviewAsk: { sentAt: 1 } }),
      ev({ id: "skip", date: "2026-11-20", reviewAskSkip: true }),
      ev({ id: "noEmail", date: "2026-11-20", email: "" }),
      ev({ id: "noEmailNoted", date: "2026-11-20", email: "", reviewAsk: { noEmailOn: "2026-11-21" } }),
      ev({ id: "quoted", date: "2026-11-20", status: "quoted" }),
    ],
    today
  );
  assert.deepEqual(
    due.map((d) => `${d.id}:${d.action}`),
    ["yesterday:send", "missed2:send", "noEmail:noEmail"]
  );
});
