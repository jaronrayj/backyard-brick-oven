import test from "node:test";
import assert from "node:assert/strict";
import { entryFor, findHandMade, googleIdFor, onlyCalendarChanged, parseTime, planSync, sigOf, syncOne } from "./calendarSync.js";

const jess = { name: "Jess and Austin", eventType: "Wedding", weddingPart: "Luncheon or dinner", status: "quoted", date: "2027-04-17", time: "12:30 pm", location: "Huntsville Mercantile", guests: 120, phone: "801-555-0100", addOns: ["Salad"] };

test("times people type", () => {
  assert.deepEqual(parseTime("5:30 pm"), { h: 17, m: 30 });
  assert.deepEqual(parseTime("5pm"), { h: 17, m: 0 });
  assert.deepEqual(parseTime("17:00"), { h: 17, m: 0 });
  assert.deepEqual(parseTime("around 6"), { h: 18, m: 0 });
  assert.deepEqual(parseTime("5-8 PM"), { h: 17, m: 0 });
  assert.deepEqual(parseTime("11:30 am"), { h: 11, m: 30 });
  assert.deepEqual(parseTime("12 pm"), { h: 12, m: 0 });
  assert.equal(parseTime("Evening"), null);
  assert.equal(parseTime(""), null);
});

test("quoted -> tentative, gray; booked/done -> confirmed", () => {
  const q = entryFor(jess, "abc");
  assert.equal(q.summary, "(Tentative) Jess and Austin – Wedding (luncheon or dinner), 120 guests");
  assert.equal(q.status, "tentative");
  assert.equal(q.colorId, "8");
  assert.deepEqual(q.start, { dateTime: "2027-04-17T12:30:00", timeZone: "America/Denver" });
  assert.deepEqual(q.end, { dateTime: "2027-04-17T15:00:00", timeZone: "America/Denver" });
  assert.equal(q.location, "Huntsville Mercantile");
  assert.match(q.description, /Open in Events: https:\/\/backyardbrickovenpizza\.com\/events\?event=abc/);
  assert.match(q.description, /801-555-0100/);
  assert.equal(q.extendedProperties.private.byboEvent, "abc");
  const b = entryFor({ ...jess, status: "booked" }, "abc");
  assert.equal(b.summary, "Jess and Austin – Wedding (luncheon or dinner), 120 guests");
  assert.equal(b.status, "confirmed");
  assert.equal(b.colorId, null);
  assert.equal(entryFor({ ...jess, status: "done" }, "abc").status, "confirmed");
});

test("no time: all day; no date, inquiry or lost: no entry", () => {
  const e = entryFor({ ...jess, time: "Evening", date: "2026-12-31" }, "x");
  assert.deepEqual(e.start, { date: "2026-12-31" });
  assert.deepEqual(e.end, { date: "2027-01-01" });
  assert.equal(entryFor({ ...jess, date: "" }, "x"), null);
  assert.equal(entryFor({ ...jess, status: "inquiry" }, "x"), null);
  assert.equal(entryFor({ ...jess, status: "lost" }, "x"), null);
});

test("Google ids are valid base32hex and stable", () => {
  const g = googleIdFor("AbC123xyz");
  assert.match(g, /^[0-9a-v]{5,1024}$/);
  assert.equal(googleIdFor("AbC123xyz"), g);
  assert.notEqual(googleIdFor("other"), g);
});

test("plan: add, skip unchanged, remove, respect opt-out and hand-made", () => {
  assert.equal(planSync(jess, "a").do, "upsert");
  const sig = sigOf(entryFor(jess, "a"));
  assert.equal(planSync({ ...jess, calendar: { id: "g", sig } }, "a").do, "none");
  assert.equal(planSync({ ...jess, guests: 130, calendar: { id: "g", sig } }, "a").do, "upsert");
  assert.equal(planSync({ ...jess, status: "booked", calendar: { id: "g", sig } }, "a").do, "upsert");
  assert.equal(planSync({ ...jess, status: "lost", calendar: { id: "g", sig } }, "a").do, "remove");
  assert.equal(planSync({ ...jess, status: "lost", calendar: { id: "g", removed: true } }, "a").do, "none");
  assert.equal(planSync({ ...jess, status: "lost" }, "a").do, "none");
  assert.equal(planSync({ ...jess, calendar: { id: "g", optOut: true } }, "a").do, "none");
  assert.equal(planSync({ ...jess, calendar: { revive: true } }, "a").do, "upsert");
  assert.equal(planSync({ ...jess, status: "lost", calendar: { id: "mine", manual: true } }, "a").do, "none");
});

test("saves that only touch `calendar` don't sync again (no loops)", () => {
  const before = { ...jess, updatedAt: 1 };
  assert.equal(onlyCalendarChanged(before, { ...before, calendar: { id: "g", sig: "s" } }), true);
  assert.equal(onlyCalendarChanged(before, { ...before, calendar: { error: "403" } }), true);
  assert.equal(onlyCalendarChanged(before, { ...before, calendar: { revive: true } }), false);
  assert.equal(onlyCalendarChanged(before, { ...before, guests: 90 }), false);
  assert.equal(onlyCalendarChanged(null, before), false);
});

test("hand-made entries: same day, customer's name in the title", () => {
  const items = [
    { id: "pf", summary: "Pizza Friday" },
    { id: "app", summary: "(Tentative) Jess and Austin", extendedProperties: { private: { byboEvent: "z" } } },
    { id: "mine", summary: "jess wedding huntsville" },
  ];
  assert.equal(findHandMade(items, jess).id, "mine");
  assert.equal(findHandMade([{ id: "j", summary: "Jessica party" }], jess), null);
  assert.equal(findHandMade(items, { name: "Al" }), null);
});

// Google Calendar stand-in: records calls, answers per method.
const fakeGoogle = (answers) => {
  const calls = [];
  global.fetch = async (url, init = {}) => {
    const method = init.method || "GET";
    calls.push({ method, url, body: init.body ? JSON.parse(init.body) : null });
    const a = answers(method, url) || { status: 200, body: {} };
    return { ok: a.status < 300, status: a.status, text: async () => JSON.stringify(a.body || {}) };
  };
  return calls;
};
const deps = { token: async () => "t", calendarId: async () => "cal" };

test("sync: new event is added with its fixed id", async () => {
  const calls = fakeGoogle((m, url) => (m === "GET" && /\/events\/ev/.test(url) ? { status: 404 } : m === "GET" ? { status: 200, body: { items: [] } } : null));
  const next = await syncOne("abc", jess, deps);
  const post = calls.find((c) => c.method === "POST");
  assert.equal(post.body.id, googleIdFor("abc"));
  assert.equal(post.body.status, "tentative");
  assert.equal(next.id, googleIdFor("abc"));
  assert.ok(next.sig);
});

test("sync: links a hand-made entry instead of adding one", async () => {
  const calls = fakeGoogle((m, url) =>
    m === "GET" && /\/events\/ev/.test(url) ? { status: 404 } : m === "GET" ? { status: 200, body: { items: [{ id: "mine", summary: "Jess wedding", start: { date: "2027-04-17" } }] } } : null
  );
  const next = await syncOne("abc", jess, deps);
  assert.deepEqual({ id: next.id, manual: next.manual }, { id: "mine", manual: true });
  assert.equal(calls.filter((c) => c.method !== "GET").length, 0);
});

test("sync: deleted in Google Calendar -> stays off; booked -> confirmed", async () => {
  fakeGoogle((m) => (m === "GET" ? { status: 200, body: { status: "cancelled" } } : null));
  const off = await syncOne("abc", { ...jess, calendar: { id: "g", sig: "old" } }, deps);
  assert.equal(off.optOut, true);
  const calls = fakeGoogle((m) => (m === "GET" ? { status: 200, body: { status: "tentative" } } : null));
  await syncOne("abc", { ...jess, status: "booked", calendar: { id: "g", sig: "old" } }, deps);
  const patch = calls.find((c) => c.method === "PATCH");
  assert.equal(patch.body.status, "confirmed");
  assert.equal(patch.body.summary.startsWith("(Tentative)"), false);
});

test("sync: lost removes it; Put it back revives one deleted there", async () => {
  let calls = fakeGoogle(() => null);
  const gone = await syncOne("abc", { ...jess, status: "lost", calendar: { id: "g", sig: "s" } }, deps);
  assert.equal(calls[0].method, "DELETE");
  assert.equal(gone.removed, true);
  calls = fakeGoogle((m) => (m === "GET" ? { status: 200, body: { status: "cancelled" } } : null));
  const back = await syncOne("abc", { ...jess, calendar: { revive: true } }, deps);
  assert.equal(calls.find((c) => c.method === "PATCH").body.status, "tentative");
  assert.ok(back.sig);
});
