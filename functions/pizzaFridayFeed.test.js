import test from "node:test";
import assert from "node:assert/strict";
import { isPizzaFriday, pizzaFridayIcs, utahTime } from "./pizzaFridayFeed.js";

test("which entries are Pizza Fridays", () => {
  assert.equal(isPizzaFriday({ title: "Pizza Friday" }), true);
  assert.equal(isPizzaFriday({ title: "pizza friday!" }), true);
  assert.equal(isPizzaFriday({ title: "Pizza Friday CANCELLED" }), false);
  assert.equal(isPizzaFriday({ title: "Pizza prep" }), false);
  assert.equal(isPizzaFriday({ title: "Jess and Austin wedding" }), false);
});

test("5 pm Utah time in winter and summer", () => {
  assert.equal(utahTime("2026-11-13", 17, 0).toISOString(), "2026-11-14T00:00:00.000Z"); // MST, UTC-7
  assert.equal(utahTime("2026-07-10", 17, 0).toISOString(), "2026-07-10T23:00:00.000Z"); // MDT, UTC-6
  assert.equal(utahTime("2026-11-13", 19, 30).toISOString(), "2026-11-14T02:30:00.000Z");
});

test("feed: only Pizza Fridays, public details only, one per date", () => {
  const ics = pizzaFridayIcs(
    [
      { id: "a", title: "Pizza Friday", date: "2026-11-27", location: "123 Home St", notes: "Sarah helps" },
      { id: "b", title: "Pizza Friday", date: "2026-11-13", location: "123 Home St" },
      { id: "c", title: "Pizza Friday", date: "2026-11-13" },
      { id: "d", title: "Pizza prep", date: "2026-11-11" },
      { id: "e", title: "Smith wedding", date: "2026-11-21" },
      { id: "f", title: "Pizza Friday - cancelled", date: "2026-12-04" },
    ],
    new Date("2026-11-10T12:00:00Z")
  );
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.match(ics, /UID:pizza-friday-2026-11-13@backyardbrickovenpizza\.com/);
  assert.match(ics, /DTSTART:20261114T000000Z\r\nDTEND:20261114T023000Z/);
  assert.match(ics, /UID:pizza-friday-2026-11-27@/);
  assert.doesNotMatch(ics, /Home St|Sarah|wedding|2026-12-04|2026-11-11/);
  assert.ok(ics.split("\r\n").every((l) => Buffer.byteLength(l) <= 75), "lines folded at 75 octets");
  assert.doesNotMatch(ics, /wood/i);
});

test("an empty calendar is still a valid feed", () => {
  const ics = pizzaFridayIcs([]);
  assert.match(ics, /BEGIN:VCALENDAR[\s\S]*END:VCALENDAR/);
  assert.doesNotMatch(ics, /VEVENT/);
});
