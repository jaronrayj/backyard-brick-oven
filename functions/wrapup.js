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
const colName = (i) => {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

// Columns the site fills, by header. Formula columns ("Column 1" etc.) are left alone.
export const writableHeaders = (headers) => {
  let last = -1;
  headers.forEach((h, i) => {
    if (String(h || "").trim() && !/^column \d+$/i.test(String(h).trim())) last = i;
  });
  return headers.slice(0, last + 1);
};

// "M/D/YYYY H:MM:SS" in Utah time, like a form timestamp.
export const sheetTimestamp = (now = new Date()) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    })
      .formatToParts(now)
      .map((x) => [x.type, x.value])
  );
  return `${p.month}/${p.day}/${p.year} ${p.hour}:${p.minute}:${p.second}`;
};
// "2026-10-30" -> "10/30/2026"
export const sheetDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  return m ? `${Number(m[2])}/${Number(m[3])}/${m[1]}` : String(iso || "");
};
// "18:35" -> "6:35 PM"
export const sheetTime = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ""));
  if (!m) return String(hhmm || "");
  const h = Number(m[1]);
  return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
};

// One row of values in header order. `values` is keyed by header text.
export const buildRow = (headers, values, now = new Date()) =>
  writableHeaders(headers).map((h) => {
    const key = String(h || "").trim();
    if (/^timestamp$/i.test(key)) return sheetTimestamp(now);
    const v = values[key];
    if (v == null || v === "") return "";
    if (/date of event/i.test(key)) return sheetDate(v);
    if (/what time/i.test(key)) return sheetTime(v);
    return String(v);
  });

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

const addDays = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// What the wrap-up page needs: the sheet's columns, recent tracker events and
// recent calendar events. A calendar or sheet problem comes back as a message
// rather than an error, so the page still works with what it has.
export const wrapUpOptions = onCall({ invoker: "public" }, async (request) => {
  await requireAdmin(request);
  const db = getFirestore();
  const today = localDate(new Date());
  const from = addDays(today, -21);
  const to = addDays(today, 1);
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
    }));

  return { headers: writableHeaders(headers), calendar, events, calendarId, problems, today };
});

// Write one wrap-up into the next empty row (by column A) of Form Responses.
// A plain "append" would land below the year-formula rows that run down the
// last column, so the row is found and filled directly.
export const submitWrapUp = onCall({ invoker: "public" }, async (request) => {
  await requireAdmin(request);
  const { values, eventId } = request.data || {};
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
