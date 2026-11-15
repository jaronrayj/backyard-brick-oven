// Events -> the "pizza events" Google Calendar.
//
//   Quoted          -> a tentative entry: "(Tentative) Name – Type, 120 guests", gray
//   Booked or Done  -> the same entry, confirmed (normal color)
//   Inquiry, Lost, no date, or deleted in the app -> the entry is removed
//   Date, time, place, guests or type change -> the entry follows
//
// Each event gets one entry with a fixed Google id ("ev" + the event id in hex),
// so two quick saves can never make two entries. Deleting the entry in Google
// Calendar means "keep this one off my calendar": the app leaves it off until
// "Put it back on my calendar" on the Events page (calendar.revive).
// An entry already on the calendar that day with the customer's name in its
// title (added by hand) is linked instead of adding a second one, and the app
// never changes or deletes a hand-made entry.
//
// Tentative entries are left out of everything else that reads the calendar
// (Planner suggestions, wrap-up, morning summary, Pizza Fridays feed): see
// readCalendar in wrapup.js.
//
// events/{id}.calendar: { id, sig, at } on the calendar | { id, manual: true }
//   linked to a hand-made entry | { id, removed: true } taken off by the app |
//   { id, optOut: true } deleted in Google Calendar | { revive: true } asked to
//   put it back. Written only by this function, apart from revive.
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { accessToken } from "./google.js";
import { calendarIdNow } from "./wrapup.js";
import { cancelTastingsFor, shouldCancelTastings } from "./tasting.js";

if (!getApps().length) initializeApp();

const SITE = "https://backyardbrickovenpizza.com";
const TZ = "America/Denver";
const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const GRAPHITE = "8"; // Google Calendar color for tentative entries
// Event-day timing (Events > Pricing > Event day, saved as eventSettings/pricing.eventDay).
// The calendar entry runs from leaving home to the end of cleanup.
export const DEFAULT_EVENT_DAY = {
  setup: 60, // there this long before service starts
  pack: 30, // collecting equipment after service
  cleanup: 30, // after getting home
  serviceMinutes: 150, // when only a start time is given
  mph: 45, // average driving speed, for the drive estimate
};
const BOUNTIFUL = { lat: 40.8894, lon: -111.8808 }; // where the drive starts and ends
const ROAD_FACTOR = 1.25; // roads vs. a straight line
const GUESSED_DRIVE = 30; // minutes, when there's no miles or location at all

export const eventDayFrom = (pricing) => {
  const saved = (pricing && pricing.eventDay) || {};
  const num = (k) => (Number.isFinite(Number(saved[k])) && saved[k] !== "" && Number(saved[k]) >= 0 ? Number(saved[k]) : DEFAULT_EVENT_DAY[k]);
  return { setup: num("setup"), pack: num("pack"), cleanup: num("cleanup"), serviceMinutes: num("serviceMinutes") || 150, mph: num("mph") || 45 };
};

// Google event id for an app event: base32hex (0-9, a-v), so hex is safe.
export const googleIdFor = (id) => `ev${Buffer.from(String(id), "utf8").toString("hex")}`;

const MER = "(a\\.?m\\.?|p\\.?m\\.?)";
const withMer = (h, mer) => {
  if (/^p/.test(mer || "") && h < 12) return h + 12;
  if (/^a/.test(mer || "") && h === 12) return 0;
  return h;
};

// "5:30 pm", "5pm", "17:00", "around 6", "5-8 PM" -> { h, m }; nothing usable -> null.
export const parseTime = (text) => {
  const t = String(text || "").toLowerCase();
  const m = new RegExp(`\\b(\\d{1,2})(?::(\\d{2}))?\\s*${MER}?`).exec(t);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (h > 23 || min > 59) return null;
  const mer = m[3] || (new RegExp(MER).exec(t.slice(m.index + m[0].length)) || [])[1] || "";
  if (mer) h = withMer(h, mer);
  else if (h >= 1 && h <= 9) h += 12; // "5" for a party means 5 pm
  return { h, m: min };
};

// Service window from the time field, in minutes after midnight:
// "5-8 pm", "11–2pm", "12:30 pm to 3", "6:00 pm" (end = start + serviceMinutes).
export const parseService = (text, serviceMinutes = DEFAULT_EVENT_DAY.serviceMinutes) => {
  const t = String(text || "").toLowerCase();
  const r = new RegExp(`\\b(\\d{1,2})(?::(\\d{2}))?\\s*${MER}?\\s*(?:-|–|—|to|until|till)\\s*(\\d{1,2})(?::(\\d{2}))?\\s*${MER}?`).exec(t);
  if (r) {
    let [sh, sm, smer, eh, em, emer] = [Number(r[1]), Number(r[2] || 0), r[3] || "", Number(r[4]), Number(r[5] || 0), r[6] || ""];
    if (sh > 23 || eh > 23 || sm > 59 || em > 59) return null;
    eh = emer ? withMer(eh, emer) : eh >= 1 && eh <= 11 ? eh + 12 : eh; // "6-10" ends at 10 pm
    if (smer) sh = withMer(sh, smer);
    else if (sh < 12 && sh + 12 <= eh) sh += 12; // "5-8 pm": 5 pm; "11-2 pm": 11 am
    const start = sh * 60 + sm;
    let end = eh * 60 + em;
    if (end <= start) end += 12 * 60;
    return { start, end };
  }
  const one = parseTime(t);
  return one ? { start: one.h * 60 + one.m, end: one.h * 60 + one.m + serviceMinutes } : null;
};

const km = (a, b) => {
  const rad = (d) => (d * Math.PI) / 180;
  const x = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
};

// One-way drive: { minutes, miles, how } from the event's miles, else its town.
export const driveFor = (event, timing = DEFAULT_EVENT_DAY) => {
  const e = event || {};
  let miles = Number(e.miles) || 0;
  let how = "miles";
  if (!miles && e.geo && Number.isFinite(Number(e.geo.lat)) && Number.isFinite(Number(e.geo.lon))) {
    miles = (km(BOUNTIFUL, { lat: Number(e.geo.lat), lon: Number(e.geo.lon) }) / 1.609) * ROAD_FACTOR;
    how = "town";
  }
  if (!miles) return { minutes: GUESSED_DRIVE, miles: 0, how: "guess" };
  const minutes = Math.max(10, Math.ceil(((miles / (timing.mph || 45)) * 60) / 5) * 5);
  return { minutes, miles: Math.round(miles), how };
};

const pad = (n) => String(n).padStart(2, "0");
const firstName = (name) => (String(name || "").trim().split(/\s+/)[0] || "").replace(/[^\p{L}'-]/gu, "");

// Minutes after midnight on `date` (can run past midnight) -> "YYYY-MM-DDTHH:MM:00".
const wall = (date, minutes) => {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, 0, minutes)).toISOString().slice(0, 16) + ":00";
};
// 1020 -> "5:00 pm"; short drops ":00".
export const clock = (minutes, { short = false } = {}) => {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h % 12 || 12}${short && !mm ? "" : `:${pad(mm)}`} ${h < 12 ? "am" : "pm"}`;
};
// "5–8 pm", "11 am–2 pm", "12:30–3 pm"
export const clockRange = (a, b) => {
  const [x, y] = [clock(a, { short: true }), clock(b, { short: true })];
  const [xt, xm] = x.split(" ");
  const [, ym] = y.split(" ");
  return xm === ym ? `${xt}–${y}` : `${x}–${y}`;
};
const span = (minutes) => (minutes % 60 ? (minutes > 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min` : `${minutes} min`) : `${minutes / 60} hr`);

// What the entry should look like for this event, or null for no entry.
// It covers the whole day's work: leave home, set up, service, pack up, drive
// home, clean up. The title and description list the service time itself.
export const entryFor = (event, id, timing = DEFAULT_EVENT_DAY) => {
  const e = event || {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date || "")) return null;
  if (!["quoted", "booked", "done"].includes(e.status)) return null;
  const tentative = e.status === "quoted";
  const type = String(e.eventType || "").trim();
  const part = String(e.weddingPart || "").trim();
  const guests = Number(e.guests) || 0;
  const service = parseService(e.time, timing.serviceMinutes);
  const drive = driveFor(e, timing);
  const summary = [
    tentative ? "(Tentative) " : "",
    String(e.name || "").trim() || type || "Event",
    type && String(e.name || "").trim() ? ` – ${type}${part ? ` (${part.toLowerCase()})` : ""}` : "",
    guests ? `, ${guests} guests` : "",
    service ? ` · service ${clockRange(service.start, service.end)}` : "",
  ].join("");

  let start, end, plan = [];
  if (service) {
    const arrive = service.start - timing.setup;
    const leave = arrive - drive.minutes;
    const packed = service.end + timing.pack;
    const home = packed + drive.minutes;
    const done = home + timing.cleanup;
    const driveText =
      drive.how === "guess"
        ? `${span(drive.minutes)} drive, a guess: add miles to the event`
        : `${span(drive.minutes)} drive, ${drive.miles} mi${drive.how === "town" ? " estimated from the town" : ""}`;
    plan = [
      `Leave by ${clock(leave)} (${driveText})`,
      `Set up from ${clock(arrive)}`,
      `SERVICE ${clock(service.start)}–${clock(service.end)}`,
      timing.pack ? `Pack up until ${clock(packed)}` : "",
      `Home about ${clock(home)}${timing.cleanup ? `, clean up until ${clock(done)}` : ""}`,
    ].filter(Boolean);
    start = { dateTime: wall(e.date, leave), timeZone: TZ };
    end = { dateTime: wall(e.date, done), timeZone: TZ };
  } else {
    const next = new Date(`${e.date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    start = { date: e.date };
    end = { date: next.toISOString().slice(0, 10) };
    plan = [`No service time yet${e.time ? ` ("${e.time}")` : ""}: add one like "5-8 pm" to block out the day.`];
  }
  const description = [
    tentative ? "Tentative: quoted, not booked yet." : "Booked.",
    ...plan,
    "",
    type && `Type: ${type}${part ? ` (${part})` : ""}`,
    guests && `Guests: ${guests}`,
    (e.addOns || []).length ? `Add-ons: ${e.addOns.join(", ")}` : "",
    [e.name, e.phone].filter(Boolean).join(" · "),
    `Open in Events: ${SITE}/events?event=${encodeURIComponent(id)}`,
  ]
    .filter((x) => x !== false && x !== 0 && x != null)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
  return {
    summary,
    description,
    location: String(e.location || "").trim(),
    start,
    end,
    status: tentative ? "tentative" : "confirmed",
    colorId: tentative ? GRAPHITE : null,
    extendedProperties: { private: { byboEvent: String(id) } },
  };
};

// Short fingerprint of an entry, to skip saves that don't change it.
export const sigOf = (entry) => (entry ? JSON.stringify([entry.summary, entry.description, entry.location, entry.start, entry.end, entry.status]) : "");

// A hand-made entry for this event: same day, customer's first name in the title.
export const findHandMade = (items, event) => {
  const first = firstName(event.name).toLowerCase();
  if (first.length < 3) return null;
  return (
    items.find(
      (c) =>
        c.status !== "cancelled" &&
        !(c.extendedProperties && c.extendedProperties.private && c.extendedProperties.private.byboEvent) &&
        new RegExp(`\\b${first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(c.summary || "")
    ) || null
  );
};

// What to do for this save. Pure, for tests.
//   { do: "none" } | { do: "remove" } | { do: "upsert", entry, sig }
export const planSync = (event, id, timing = DEFAULT_EVENT_DAY) => {
  const cal = (event && event.calendar) || {};
  if ((cal.manual && !cal.adopt) || (cal.optOut && !cal.revive)) return { do: "none" };
  const entry = entryFor(event, id, timing);
  if (!entry) return cal.id && !cal.removed ? { do: "remove" } : { do: "none" };
  const sig = sigOf(entry);
  if (cal.id && cal.sig === sig && !cal.removed && !cal.revive && !cal.adopt) return { do: "none" };
  return { do: "upsert", entry, sig };
};

// ---------- Google Calendar ----------

const api = async (token, calendarId, path, init = {}) => {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const body = await res.text();
  if (res.ok) return body ? JSON.parse(body) : {};
  const err = new Error(`${res.status} ${body.slice(0, 300)}`);
  err.status = res.status;
  throw err;
};

const dayItems = async (token, calendarId, date) => {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const params = new URLSearchParams({
    timeMin: `${date}T00:00:00-07:00`,
    timeMax: `${next.toISOString().slice(0, 10)}T06:59:59-07:00`,
    singleEvents: "true",
    maxResults: "50",
  });
  return ((await api(token, calendarId, `?${params}`)).items || []).filter((c) => {
    const d = (c.start && (c.start.date || (c.start.dateTime && new Date(c.start.dateTime).toLocaleDateString("en-CA", { timeZone: TZ })))) || "";
    return d === date;
  });
};

// True when a save changed nothing but `calendar` (this function's own notes,
// or a sync error), unless it asks to put the entry back. Those don't sync
// again, so a failing sync can't loop.
export const onlyCalendarChanged = (before, after) => {
  if (!before || !after) return false;
  if (after.calendar && (after.calendar.revive || after.calendar.adopt)) return false;
  const rest = (d) => {
    const { calendar, ...other } = d;
    return JSON.stringify(Object.keys(other).sort().map((k) => [k, other[k]]));
  };
  return rest(before) === rest(after);
};

// Sync one event. Returns the new `calendar` value to save, or undefined for no change.
export const syncOne = async (id, event, deps = {}) => {
  const timing = deps.timing || eventDayFrom((await getFirestore().doc("eventSettings/pricing").get()).data());
  const plan = planSync(event, id, timing);
  if (plan.do === "none") return undefined;
  const token = await (deps.token || (() => accessToken([SCOPE])))();
  const calendarId = await (deps.calendarId || calendarIdNow)();
  const cal = event.calendar || {};
  // A hand-made entry the app took over ("Let the app manage it") keeps its own id.
  const adopted = !!((cal.adopt || cal.adopted) && cal.id);
  const gid = adopted ? cal.id : googleIdFor(id);
  const at = Date.now();
  const mark = adopted ? { adopted: true } : {};

  if (plan.do === "remove") {
    try {
      await api(token, calendarId, `/${gid}`, { method: "DELETE" });
    } catch (e) {
      if (![404, 410].includes(e.status)) throw e;
    }
    return { id: gid, removed: true, at, ...mark };
  }

  let current = null;
  try {
    current = await api(token, calendarId, `/${gid}`);
  } catch (e) {
    if (e.status !== 404) throw e;
  }
  if (current && current.status === "cancelled" && !cal.removed && !cal.revive) {
    // Deleted in Google Calendar: keep it off.
    return { id: gid, optOut: true, at, ...mark };
  }
  if (current) {
    await api(token, calendarId, `/${gid}`, { method: "PATCH", body: JSON.stringify(plan.entry) });
    return { id: gid, sig: plan.sig, at, ...mark };
  }
  if (adopted) {
    // The hand-made entry is gone for good: make the app's own entry instead.
    return syncOne(id, { ...event, calendar: { revive: true } }, { ...deps, timing });
  }
  const handMade = findHandMade(await dayItems(token, calendarId, event.date), event);
  if (handMade) return { id: handMade.id, manual: true, at };
  try {
    await api(token, calendarId, "", { method: "POST", body: JSON.stringify({ id: gid, ...plan.entry }) });
  } catch (e) {
    if (e.status !== 409) throw e;
    // Made a moment ago by another save of this event.
    await api(token, calendarId, `/${gid}`, { method: "PATCH", body: JSON.stringify(plan.entry) });
  }
  return { id: gid, sig: plan.sig, at };
};

export const syncEventCalendar = onDocumentWritten({ document: "events/{id}", region: "us-central1" }, async (change) => {
  const id = change.params.id;
  const before = change.data && change.data.before && change.data.before.exists ? change.data.before.data() : null;
  const after = change.data && change.data.after && change.data.after.exists ? change.data.after.data() : null;
  // Lost or deleted: close its tastings and take a booked one off the calendar.
  if (shouldCancelTastings(before, after)) {
    try {
      const n = await cancelTastingsFor(id);
      if (n && after) {
        await getFirestore()
          .doc(`events/${id}`)
          .update({
            "tasting.cancelled": true,
            history: FieldValue.arrayUnion({ at: Date.now(), type: "note", text: "Tasting cancelled (marked Lost)" }),
          });
      }
    } catch (e) {
      logger.error(`Couldn't cancel the tastings for event ${id}`, e);
    }
  }
  try {
    if (!after) {
      // Deleted in the app: take its entry off too (never a hand-made one).
      const cal = (before && before.calendar) || {};
      if (cal.id && !cal.manual && !cal.removed && !cal.optOut) {
        await syncOne(id, { ...before, status: "lost", calendar: cal });
      }
      return;
    }
    if (onlyCalendarChanged(before, after)) return;
    const next = await syncOne(id, after);
    if (next) await getFirestore().doc(`events/${id}`).update({ calendar: next });
  } catch (e) {
    logger.error(`Calendar sync failed for event ${id}`, e);
    if (after) {
      await getFirestore()
        .doc(`events/${id}`)
        .update({ "calendar.error": String(e.status || e.message || e).slice(0, 200), "calendar.errorAt": Date.now() })
        .catch(() => {});
    }
  }
});
