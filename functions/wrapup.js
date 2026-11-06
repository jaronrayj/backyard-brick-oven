// Event wrap-up (/events/wrapup): replaces the "money tracker" Google Form.
// Lists recent events from the tracker (Firestore `events`) and from Google
// Calendar (with each event's notes), then writes the wrap-up into the next
// empty row of the money tracker's "Form Responses" tab, the same row a form
// submission would fill, so the planner and anything else reading the sheet
// keep working.
//
// Runs as the Cloud Functions service account. It needs EDIT access to the
// money tracker sheet and "See all event details" on the business calendar.
// A failed read says which email to share with. See docs/events.md.
import { onCall, HttpsError } from "firebase-functions/v2/https";
import logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { accessToken as tokenFor, serviceAccountEmail } from "./google.js";
import { requireRole } from "./team.js";
import { EDIT_DAYS, addDays, buildRow, changedCells, colName, isRecent, recentRows, rowDate, rowKey, writableHeaders } from "./wrapupRows.js";

if (!getApps().length) initializeApp();

const TRACKER = "1osNU39tVU3GrkrgSiR7Mw1kdE6ErDxnu5R3nu0K0izQ"; // money tracker
const TAB = "Form Responses";
const DEFAULT_CALENDAR = "9c2393d979144f8e78849fe80c79ccb0c6b45a0c2748dce33725e181a1fdd343@group.calendar.google.com"; // "pizza events" (owned by jj.backyardbrickoven@gmail.com)
const TZ = "America/Denver";
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/calendar.readonly",
];
const accessToken = () => tokenFor(SCOPES);

const google = async (token, url, init = {}) => {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const body = await res.text();
  if (res.ok) return body ? JSON.parse(body) : {};
  const err = new Error(`${res.status} ${body.slice(0, 300)}`);
  err.status = res.status;
  err.disabled = /SERVICE_DISABLED|has not been used|is disabled/i.test(body);
  throw err;
};

// "404 Not Found" from a failed call, for messages on the page.
const googleReason = (e) => {
  const m = /^(\d+) (.*)$/s.exec(String(e.message || ""));
  if (!m) return String(e.message || e);
  try {
    return `${m[1]} ${JSON.parse(m[2]).error.message}`;
  } catch {
    return `${m[1]} ${m[2].slice(0, 120)}`;
  }
};

const requireAdmin = (request) => requireRole(request, ["admin"], "Only admins can wrap up events.");

// ---------- Sheet ----------

const SHEET = `https://sheets.googleapis.com/v4/spreadsheets/${TRACKER}/values`;
const readHeaders = async (token) =>
  ((await google(token, `${SHEET}/${encodeURIComponent(`${TAB}!1:1`)}`)).values || [[]])[0];

// ---------- Calendar ----------

const stripHtml = (s) =>
  String(s || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const localDate = (d) => d.toLocaleDateString("en-CA", { timeZone: TZ });

export const calendarItem = (e) => {
  const start = e.start || {};
  const date = start.date || (start.dateTime ? localDate(new Date(start.dateTime)) : "");
  const time = start.dateTime
    ? new Date(start.dateTime).toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" })
    : "";
  return {
    id: e.id,
    title: String(e.summary || "").trim(),
    date,
    time,
    location: String(e.location || "").trim(),
    notes: stripHtml(e.description),
    endsAt: (e.end && e.end.dateTime) || "", // ISO; blank for all-day entries
  };
};

const readCalendar = async (token, calendarId, fromISO, toISO) => {
  const params = new URLSearchParams({
    timeMin: `${fromISO}T00:00:00-07:00`,
    timeMax: `${toISO}T23:59:59-07:00`,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "100",
  });
  const data = await google(
    token,
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`
  );
  return (data.items || []).filter((e) => e.status !== "cancelled").map(calendarItem);
};

// Business calendar entries from..to (YYYY-MM-DD), for the morning summary.
export const calendarBetween = async (fromISO, toISO) => {
  const settings = (await getFirestore().doc("eventSettings/wrapUp").get()).data() || {};
  const calendarId = settings.calendarId || DEFAULT_CALENDAR;
  return { calendarId, items: await readCalendar(await accessToken(), calendarId, fromISO, toISO) };
};

// Calendar entries with a wrap-up saved or skipped (Firestore wrapUps/{id}):
// Map of id -> "done" | "skipped".
const docId = (id) => String(id).replace(/\//g, "_");
const calendarWrapState = async (ids) => {
  const db = getFirestore();
  const refs = [...new Set(ids.filter(Boolean))].map((id) => db.doc(`wrapUps/${docId(id)}`));
  if (!refs.length) return new Map();
  const snaps = await db.getAll(...refs);
  return new Map(snaps.filter((s) => s.exists).map((s) => [s.id, s.data().skipped ? "skipped" : "done"]));
};

// What still needs a wrap-up on these dates: tracker events (booked or done,
// no wrapUp yet) and calendar entries on days without a tracker event, with
// no wrap-up saved. [{key, date, title, endsAt}]; endsAt is the calendar end
// time (ISO), from the same-day calendar entries for a tracker event, or "".
export const notWrappedUp = async (dates) => {
  if (!dates.length) return [];
  const sorted = [...dates].sort();
  const db = getFirestore();
  const evSnap = await db.collection("events").where("date", ">=", sorted[0]).get();
  const events = evSnap.docs
    .map((d) => d.data())
    .filter((e) => dates.includes(e.date) && ["booked", "done"].includes(e.status));
  const eventDays = new Set(events.map((e) => e.date));
  const { items } = await calendarBetween(sorted[0], sorted[sorted.length - 1]);
  const cal = items.filter((c) => dates.includes(c.date) && !eventDays.has(c.date));
  const state = await calendarWrapState(cal.map((c) => c.id));
  const latestEnd = (date) =>
    items
      .filter((c) => c.date === date && c.endsAt)
      .map((c) => c.endsAt)
      .sort()
      .pop() || "";
  return [
    ...evSnap.docs
      .filter((d) => dates.includes(d.data().date) && ["booked", "done"].includes(d.data().status) && !d.data().wrapUp && !d.data().wrapUpSkipped)
      .map((d) => ({ key: `e:${d.id}`, date: d.data().date, title: d.data().name || d.data().eventType || "Event", endsAt: latestEnd(d.data().date) })),
    ...cal
      .filter((c) => !state.has(docId(c.id)))
      .map((c) => ({ key: `c:${c.id}`, date: c.date, title: c.title || "Calendar event", endsAt: c.endsAt })),
  ];
};

// What the wrap-up page needs: the sheet's columns, recent tracker events and
// recent calendar events. A calendar or sheet problem comes back as a message
// rather than an error, so the page still works with what it has.
export const wrapUpOptions = onCall({ invoker: "public" }, async (request) => {
  await requireAdmin(request);
  const db = getFirestore();
  const today = localDate(new Date());
  // The last week, through today.
  const from = addDays(today, -7);
  const to = today;
  const settings = (await db.doc("eventSettings/wrapUp").get()).data() || {};
  const calendarId = settings.calendarId || DEFAULT_CALENDAR;
  const sa = await serviceAccountEmail();
  const problems = [];

  let token = null;
  try {
    token = await accessToken();
  } catch (e) {
    logger.error("No access token", e);
    problems.push("The server couldn't get access to Google right now.");
  }

  let headers = [];
  if (token) {
    try {
      headers = await readHeaders(token);
    } catch (e) {
      logger.error("Sheet header read failed", e);
      problems.push(
        e.disabled
          ? "The Google Sheets API is turned off for this Firebase project."
          : `Can't open the money tracker. Share it with ${sa} as an Editor.`
      );
    }
  }

  let calendar = [];
  if (token) {
    try {
      calendar = await readCalendar(token, calendarId, from, to);
    } catch (e) {
      logger.error("Calendar read failed", e);
      problems.push(
        e.disabled
          ? "The Google Calendar API is turned off for this Firebase project. Turn it on at https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=backyard-brickoven"
          : `Can't read the calendar ${calendarId}. In Google Calendar, share it with ${sa} ("See all event details"). (Google said: ${googleReason(e)})`
      );
    }
  }

  const snap = await db.collection("events").where("date", ">=", from).get();
  const events = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((e) => e.date <= to && ["booked", "done"].includes(e.status))
    .map((e) => ({
      id: e.id,
      name: e.name || "",
      eventType: e.eventType || "",
      date: e.date,
      time: e.time || "",
      location: e.location || "",
      guests: e.guests || "",
      notes: e.notes || "",
      wrappedUp: !!e.wrapUp,
      skipped: !!e.wrapUpSkipped,
    }));

  const state = await calendarWrapState(calendar.map((c) => c.id));
  calendar = calendar.map((c) => ({
    ...c,
    wrappedUp: state.get(docId(c.id)) === "done",
    skipped: state.get(docId(c.id)) === "skipped",
  }));
  return { headers: writableHeaders(headers), calendar, events, calendarId, problems, today };
});

// Calendar entries on the wrap-up's date whose title matches its name.
export const matchesName = (title, name) => {
  const t = String(title || "").toLowerCase();
  const n = String(name || "").trim().toLowerCase();
  if (!n) return false;
  if (n === "prep") return /\bprep\b/.test(t);
  return t.includes(n) || n.includes(t);
};
const closeMatchingCalendar = async (values, row, by) => {
  const date = Object.entries(values).find(([h]) => /date of event/i.test(h))?.[1];
  const name = Object.entries(values).find(([h]) => /pizza friday or event/i.test(h))?.[1];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) || !name) return;
  const { items } = await calendarBetween(date, date);
  const db = getFirestore();
  await Promise.all(
    items
      .filter((c) => c.date === date && matchesName(c.title, name))
      .map((c) => db.doc(`wrapUps/${docId(c.id)}`).set({ row, at: FieldValue.serverTimestamp(), by }, { merge: true }))
  );
};

// Close out a wrap-up without filling it in: it drops off the list and its
// reminders stop. key is "e:<tracker event id>" or "c:<calendar entry id>".
export const skipWrapUp = onCall({ invoker: "public" }, async (request) => {
  await requireAdmin(request);
  const key = String((request.data || {}).key || "");
  const m = /^([ec]):(.+)$/.exec(key);
  if (!m) throw new HttpsError("invalid-argument", "Nothing to skip.");
  const db = getFirestore();
  const mark = { at: FieldValue.serverTimestamp(), by: request.auth.token.email };
  if (m[1] === "e") {
    await db.doc(`events/${m[2]}`).update({ wrapUpSkipped: mark });
  } else {
    await db.doc(`wrapUps/${docId(m[2])}`).set({ ...mark, skipped: true });
  }
  return { ok: true };
});

// For the planner's "To wrap up": the last week's events with no wrap-up,
// once they've ended (all-day entries count from that morning). Newest first.
export const wrapUpsDue = onCall({ invoker: "public" }, async (request) => {
  await requireAdmin(request);
  const today = localDate(new Date());
  const dates = Array.from({ length: 8 }, (_, i) => addDays(today, -i));
  const now = Date.now();
  const items = (await notWrappedUp(dates))
    .filter((x) => x.date < today || !x.endsAt || new Date(x.endsAt).getTime() <= now)
    .sort((a, b) => b.date.localeCompare(a.date));
  return { items };
});

// Write one wrap-up into the next empty row (by column A) of Form Responses.
// A plain "append" would land below the year-formula rows that run down the
// last column, so the row is found and filled directly.
export const submitWrapUp = onCall({ invoker: "public" }, async (request) => {
  await requireAdmin(request);
  const { values, eventId, calendarEntryId } = request.data || {};
  if (!values || typeof values !== "object") throw new HttpsError("invalid-argument", "Nothing to save.");
  const sa = await serviceAccountEmail();
  try {
    const token = await accessToken();
    const headers = await readHeaders(token);
    const row = buildRow(headers, values);
    if (!row.length) throw new HttpsError("failed-precondition", "The Form Responses tab has no header row.");
    const colA = (await google(token, `${SHEET}/${encodeURIComponent(`${TAB}!A:A`)}`)).values || [];
    const rowNum = colA.length + 1;
    const range = `${TAB}!A${rowNum}:${colName(row.length - 1)}${rowNum}`;
    await google(token, `${SHEET}/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      body: JSON.stringify({ range, majorDimension: "ROWS", values: [row] }),
    });

    if (eventId) {
      await getFirestore()
        .doc(`events/${eventId}`)
        .update({
          status: "done",
          wrapUp: { row: rowNum, values, at: FieldValue.serverTimestamp(), by: request.auth.token.email },
          updatedAt: FieldValue.serverTimestamp(),
        })
        .catch((e) => logger.error("Couldn't mark the event done", e));
    }
    // Calendar-only entries (Pizza Friday, prep days) are remembered here, so
    // the list and the wrap-up reminder know they're done.
    if (calendarEntryId && typeof calendarEntryId === "string") {
      await getFirestore()
        .doc(`wrapUps/${docId(calendarEntryId)}`)
        .set({ row: rowNum, at: FieldValue.serverTimestamp(), by: request.auth.token.email })
        .catch((e) => logger.error("Couldn't remember the calendar wrap-up", e));
    }
    // A wrap-up started from "Prep day" or "Something else" closes the
    // calendar entries it matches on that date (a "Prep" wrap-up closes the
    // day's prep entry), so their reminders stop too.
    if (!eventId && !calendarEntryId) {
      await closeMatchingCalendar(values, rowNum, request.auth.token.email).catch((e) =>
        logger.error("Couldn't match the wrap-up to the calendar", e)
      );
    }
    return { row: rowNum };
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    logger.error("Wrap-up write failed", e);
    if (e.status === 403 || e.status === 404) {
      throw new HttpsError("failed-precondition", `Can't write to the money tracker. Share it with ${sa} as an Editor.`);
    }
    throw new HttpsError("internal", "Couldn't save to the sheet. Nothing was written; try again.");
  }
});

// The last few days' wrap-ups from the sheet, for editing. Read fresh each
// time: these are money numbers that can change in the sheet directly.
export const recentWrapUps = onCall({ invoker: "public" }, async (request) => {
  await requireAdmin(request);
  const sa = await serviceAccountEmail();
  try {
    const token = await accessToken();
    const headers = await readHeaders(token);
    const last = colName(writableHeaders(headers).length - 1);
    const grid = (await google(token, `${SHEET}/${encodeURIComponent(`${TAB}!A2:${last}`)}`)).values || [];
    return { rows: recentRows(headers, grid, localDate(new Date())), days: EDIT_DAYS };
  } catch (e) {
    logger.error("Reading recent wrap-ups failed", e);
    if (e.status === 403 || e.status === 404) {
      throw new HttpsError("failed-precondition", `Can't open the money tracker. Share it with ${sa} as an Editor.`);
    }
    throw new HttpsError("internal", "Couldn't read the money tracker. Try again.");
  }
});

// Change an existing wrap-up in place. It re-reads the row first and refuses
// if it's no longer the row that was opened, and writes only the cells whose
// value changed. Never adds a row.
export const updateWrapUp = onCall({ invoker: "public" }, async (request) => {
  await requireAdmin(request);
  const { row, key, values } = request.data || {};
  if (!Number.isInteger(row) || row < 2 || typeof key !== "string" || !values || typeof values !== "object") {
    throw new HttpsError("invalid-argument", "Nothing to save.");
  }
  const sa = await serviceAccountEmail();
  try {
    const token = await accessToken();
    const headers = await readHeaders(token);
    const last = colName(writableHeaders(headers).length - 1);
    const current = (await google(token, `${SHEET}/${encodeURIComponent(`${TAB}!A${row}:${last}${row}`)}`)).values?.[0] || [];
    if (rowKey(headers, current) !== key) {
      throw new HttpsError("failed-precondition", "That row in the money tracker has changed. Nothing was saved; reload and try again.");
    }
    if (!isRecent(rowDate(headers, current), localDate(new Date()))) {
      throw new HttpsError("failed-precondition", `That event is more than ${EDIT_DAYS} days old. Change it in the money tracker's Form Responses tab.`);
    }
    const changes = changedCells(headers, current, values);
    if (changes.length) {
      await google(token, `${SHEET}:batchUpdate`, {
        method: "POST",
        body: JSON.stringify({
          valueInputOption: "USER_ENTERED",
          data: changes.map((c) => ({ range: `${TAB}!${c.col}${row}`, values: [[c.value]] })),
        }),
      });
      logger.info(`Wrap-up row ${row} edited by ${request.auth.token.email}: ${changes.map((c) => c.col).join(", ")}`);
    }
    return { row, changed: changes.length };
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    logger.error("Wrap-up edit failed", e);
    if (e.status === 403 || e.status === 404) {
      throw new HttpsError("failed-precondition", `Can't write to the money tracker. Share it with ${sa} as an Editor.`);
    }
    throw new HttpsError("internal", "Couldn't save to the sheet. Try again.");
  }
});
