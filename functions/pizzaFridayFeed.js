// Public Pizza Fridays calendar feed: backyardbrickovenpizza.com/pizza-fridays.ics
// (firebase.json rewrite). People subscribe to it from /hello and the home page
// (Apple Calendar via webcal://, Google Calendar by URL).
//
// Built from the one business calendar ("pizza events", calendarBetween in
// wrapup.js): every entry titled "Pizza Friday" that isn't cancelled. Add, move
// or delete a Pizza Friday there and subscribers follow on their next refresh.
// Only the date goes out. Every event gets the same public title, hours and
// place, never the entry's own notes, location or setup time.
import { onRequest } from "firebase-functions/v2/https";
import logger from "firebase-functions/logger";
import { calendarBetween } from "./wrapup.js";

const TZ = "America/Denver";
// Public hours (same as the home page and the site's structured data).
export const HOURS = { start: [17, 0], end: [19, 30] };
const PAST_DAYS = 14;
const AHEAD_DAYS = 120; // the calendar read returns up to 100 entries; this stays well under

export const isPizzaFriday = (item) => /pizza\s*friday/i.test(item.title || "") && !/cancel/i.test(item.title || "");

// "2026-11-13", 17, 0 -> Date for 5:00 pm Utah time that day (handles daylight saving).
export const utahTime = (dateISO, hour, minute) => {
  const [y, m, d] = dateISO.split("-").map(Number);
  for (const offset of [6, 7]) {
    const t = new Date(Date.UTC(y, m - 1, d, hour + offset, minute));
    const local = t.toLocaleString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hourCycle: "h23" });
    if (local === `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`) return t;
  }
  return new Date(Date.UTC(y, m - 1, d, hour + 7, minute));
};

const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const text = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

// Lines longer than 75 octets continue on the next line after a space (RFC 5545).
const fold = (line) => {
  const out = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 75) {
    let cut = 75;
    while (Buffer.byteLength(rest.slice(0, cut)) > 75) cut -= 1;
    out.push(rest.slice(0, cut));
    rest = ` ${rest.slice(cut)}`;
  }
  out.push(rest);
  return out.join("\r\n");
};

// Calendar entries ({ id, title, date }) -> .ics text.
export const pizzaFridayIcs = (items, now = new Date()) => {
  const seen = new Set();
  const days = items
    .filter((c) => isPizzaFriday(c) && /^\d{4}-\d{2}-\d{2}$/.test(c.date || ""))
    .filter((c) => (seen.has(c.date) ? false : seen.add(c.date)))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Backyard Brick Oven//Pizza Fridays//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Backyard Brick Oven Pizza Fridays",
    `X-WR-TIMEZONE:${TZ}`,
    "X-WR-CALDESC:Neapolitan-style pizza in Bountiful\\, Utah",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ];
  for (const { date } of days) {
    lines.push(
      "BEGIN:VEVENT",
      // One per date, so moving an entry within the day or re-creating it doesn't duplicate it.
      `UID:pizza-friday-${date}@backyardbrickovenpizza.com`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(utahTime(date, ...HOURS.start))}`,
      `DTEND:${stamp(utahTime(date, ...HOURS.end))}`,
      "SUMMARY:Pizza Friday 🍕",
      `DESCRIPTION:${text("Backyard Brick Oven Pizza Friday, 5–7:30 pm. Menu and directions: https://backyardbrickovenpizza.com")}`,
      "LOCATION:Backyard Brick Oven\\, Bountiful\\, UT",
      "URL:https://backyardbrickovenpizza.com",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
};

const utahDate = (d) => d.toLocaleDateString("en-CA", { timeZone: TZ });

export const pizzaFridaysCalendar = onRequest({ region: "us-central1" }, async (req, res) => {
  const now = new Date();
  try {
    const { items } = await calendarBetween(
      utahDate(new Date(now.getTime() - PAST_DAYS * 86400000)),
      utahDate(new Date(now.getTime() + AHEAD_DAYS * 86400000))
    );
    res.set("Content-Type", "text/calendar; charset=utf-8");
    res.set("Content-Disposition", 'inline; filename="pizza-fridays.ics"');
    // Firebase Hosting's CDN keeps it 5 minutes. Calendar apps fetch it on
    // their own schedule anyway (Apple every few hours, Google up to a day).
    res.set("Cache-Control", "public, max-age=300, s-maxage=300");
    res.status(200).send(pizzaFridayIcs(items, now));
  } catch (e) {
    // No feed beats an empty one: calendar apps would delete every Pizza Friday.
    logger.error("Pizza Fridays feed: calendar read failed", e);
    res.set("Cache-Control", "no-store");
    res.status(503).send("Calendar unavailable, try again soon.");
  }
});
