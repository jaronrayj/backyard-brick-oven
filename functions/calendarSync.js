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

if (!getApps().length) initializeApp();

const SITE = "https://backyardbrickovenpizza.com";
const TZ = "America/Denver";
const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const GRAPHITE = "8"; // Google Calendar color for tentative entries
const HOURS_LONG = 2.5; // when only a start time is known

// Google event id for an app event: base32hex (0-9, a-v), so hex is safe.
export const googleIdFor = (id) => `ev${Buffer.from(String(id), "utf8").toString("hex")}`;

// "5:30 pm", "5pm", "17:00", "around 6", "5-8 PM" -> { h, m }; nothing usable -> null.
export const parseTime = (text) => {
  const t = String(text || "").toLowerCase();
  const m = /\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/.exec(t);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (h > 23 || min > 59) return null;
  const mer = m[3] || (/(a\.?m\.?|p\.?m\.?)/.exec(t.slice(m.index + m[0].length)) || [])[1] || "";
  if (/^p/.test(mer) && h < 12) h += 12;
  else if (/^a/.test(mer) && h === 12) h = 0;
  else if (!mer && h >= 1 && h <= 9) h += 12; // "5" for a party means 5 pm
  return { h, m: min };
};

const pad = (n) => String(n).padStart(2, "0");
const firstName = (name) => (String(name || "").trim().split(/\s+/)[0] || "").replace(/[^\p{L}'-]/gu, "");

// What the entry should look like for this event, or null for no entry.
export const entryFor = (event, id) => {
  const e = event || {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date || "")) return null;
  if (!["quoted", "booked", "done"].includes(e.status)) return null;
  const tentative = e.status === "quoted";
  const type = String(e.eventType || "").trim();
  const part = String(e.weddingPart || "").trim();
  const guests = Number(e.guests) || 0;
  const summary = [
    tentative ? "(Tentative) " : "",
    String(e.name || "").trim() || type || "Event",
    type && String(e.name || "").trim() ? ` – ${type}${part ? ` (${part.toLowerCase()})` : ""}` : "",
    guests ? `, ${guests} guests` : "",
  ].join("");
  const description = [
    tentative ? "Tentative: quoted, not booked yet." : "Booked.",
    type && `Type: ${type}${part ? ` (${part})` : ""}`,
    guests && `Guests: ${guests}`,
    (e.addOns || []).length ? `Add-ons: ${e.addOns.join(", ")}` : "",
    e.time && `Time: ${e.time}`,
    [e.name, e.phone].filter(Boolean).join(" · "),
    `Open in Events: ${SITE}/events?event=${encodeURIComponent(id)}`,
  ]
    .filter(Boolean)
    .join("\n");
  const at = parseTime(e.time);
  let start, end;
  if (at) {
    const endMin = Math.min(at.h * 60 + at.m + HOURS_LONG * 60, 23 * 60 + 59);
    start = { dateTime: `${e.date}T${pad(at.h)}:${pad(at.m)}:00`, timeZone: TZ };
    end = { dateTime: `${e.date}T${pad(Math.floor(endMin / 60))}:${pad(endMin % 60)}:00`, timeZone: TZ };
  } else {
    const next = new Date(`${e.date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    start = { date: e.date };
    end = { date: next.toISOString().slice(0, 10) };
  }
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
export const planSync = (event, id) => {
  const cal = (event && event.calendar) || {};
  if (cal.manual || (cal.optOut && !cal.revive)) return { do: "none" };
  const entry = entryFor(event, id);
  if (!entry) return cal.id && !cal.removed ? { do: "remove" } : { do: "none" };
  const sig = sigOf(entry);
  if (cal.id && cal.sig === sig && !cal.removed && !cal.revive) return { do: "none" };
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
  if (after.calendar && after.calendar.revive) return false;
  const rest = (d) => {
    const { calendar, ...other } = d;
    return JSON.stringify(Object.keys(other).sort().map((k) => [k, other[k]]));
  };
  return rest(before) === rest(after);
};

// Sync one event. Returns the new `calendar` value to save, or undefined for no change.
export const syncOne = async (id, event, deps = {}) => {
  const plan = planSync(event, id);
  if (plan.do === "none") return undefined;
  const token = await (deps.token || (() => accessToken([SCOPE])))();
  const calendarId = await (deps.calendarId || calendarIdNow)();
  const cal = event.calendar || {};
  const gid = googleIdFor(id);
  const at = Date.now();

  if (plan.do === "remove") {
    try {
      await api(token, calendarId, `/${gid}`, { method: "DELETE" });
    } catch (e) {
      if (![404, 410].includes(e.status)) throw e;
    }
    return { id: gid, removed: true, at };
  }

  let current = null;
  try {
    current = await api(token, calendarId, `/${gid}`);
  } catch (e) {
    if (e.status !== 404) throw e;
  }
  if (current && current.status === "cancelled" && !cal.removed && !cal.revive) {
    // Deleted in Google Calendar: keep it off.
    return { id: gid, optOut: true, at };
  }
  if (current) {
    await api(token, calendarId, `/${gid}`, { method: "PATCH", body: JSON.stringify(plan.entry) });
    return { id: gid, sig: plan.sig, at };
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
