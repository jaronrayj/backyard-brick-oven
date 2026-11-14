// Quote emails and wedding tastings.
//
// sendQuoteEmail (admins, from the event editor): emails the quote the editor
//   built (src/pages/Events/quoteEmailText.js) to the event's email address. When
//   tasting times are offered, it makes tastings/{token} and swaps each
//   {{TASTING_n}} in the email for that time's private link
//   (/tasting?t=<token>&i=<n>). The event moves from Inquiry to Quoted.
// tastingInfo / pickTasting (public, by token): the /tasting page. Picking a
//   time saves it on the event, emails them a confirmation with the address,
//   notifies Jaron, and puts "Tasting: <name>" on the pizza events calendar.
// runTastingReminders (notificationTimer): at 9 am the day before, a reminder.
//
// tastings/{token}: { eventId, name, email, times: [ISO], minutes, createdAt,
//   picked?: ISO, pickedAt?, reminderSent?, calendarId? }. Server only (firestore.rules).
// Wording and the tasting address: eventSettings/emails (Events > Emails).
import { randomBytes } from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { GMAIL_APP_PASSWORD, GMAIL_USER, sendMail } from "./mail.js";
import { sendPush } from "./push.js";
import { requireRole } from "./team.js";
import { accessToken } from "./google.js";
import { calendarIdNow } from "./wrapup.js";
import { eventLink } from "./links.js";
import { DEFAULT_TASTING, appendSignature, renderTastingEmail, signatureFrom, tastingWhen } from "./replyText.js";

if (!getApps().length) initializeApp();

const SITE = "https://backyardbrickovenpizza.com";
const TZ = "America/Denver";
const MAX_TIMES = 8;

const emailOf = (v) => (/[^\s/<>,;]+@[^\s/<>,;]+\.[^\s/<>,;]+/.exec(String(v || "")) || [""])[0];
const utahDay = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });
const utahHour = (d) => Number(new Date(d).toLocaleString("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }));

export const tastingSettings = async () => {
  const all = (await getFirestore().doc("eventSettings/emails").get()).data() || {};
  const saved = all.tasting || {};
  return {
    ...DEFAULT_TASTING,
    ...saved,
    signature: signatureFrom(all),
    confirm: { ...DEFAULT_TASTING.confirm, ...(saved.confirm || {}) },
    reminder: { ...DEFAULT_TASTING.reminder, ...(saved.reminder || {}) },
  };
};

// Offered times worth keeping: valid, in the future, no repeats, oldest first.
export const cleanTimes = (times, now = Date.now()) =>
  [...new Set((Array.isArray(times) ? times : []).map((t) => new Date(t)).filter((d) => !Number.isNaN(d.getTime()) && d.getTime() > now).map((d) => d.toISOString()))]
    .sort()
    .slice(0, MAX_TIMES);

// Swap {{TASTING_n}} for each time's link. Times keep the order the editor sent.
export const fillTastingLinks = (s, token, count) => {
  let out = String(s || "");
  for (let i = 0; i < count; i += 1) out = out.split(`{{TASTING_${i}}}`).join(`${SITE}/tasting?t=${token}&i=${i}`);
  return out;
};

export const sendQuoteEmail = onCall({ invoker: "public", secrets: [GMAIL_APP_PASSWORD] }, async (request) => {
  await requireRole(request, ["admin"], "Only admins can email quotes.");
  const { eventId, subject, text, html, times } = request.data || {};
  if (!eventId || !String(subject || "").trim() || !String(text || "").trim()) throw new HttpsError("invalid-argument", "Missing the event or the email.");
  const db = getFirestore();
  const ref = db.doc(`events/${eventId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "That event is gone.");
  const event = snap.data();
  const to = emailOf(event.email);
  if (!to) throw new HttpsError("failed-precondition", "This event has no email address.");

  // The editor sends times in the order the buttons were built; keep that order.
  const offered = (Array.isArray(times) ? times : []).slice(0, MAX_TIMES);
  if (offered.length && cleanTimes(offered).length !== offered.length) {
    throw new HttpsError("invalid-argument", "Each tasting time needs to be in the future, with no repeats.");
  }
  let token = "";
  if (offered.length) {
    const settings = await tastingSettings();
    token = randomBytes(12).toString("hex");
    await db.doc(`tastings/${token}`).set({
      eventId,
      name: event.name || "",
      email: to,
      times: offered.map((t) => new Date(t).toISOString()),
      minutes: Number(settings.minutes) || 60,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  try {
    await sendMail({
      to,
      replyTo: GMAIL_USER,
      subject: String(subject).trim(),
      text: fillTastingLinks(text, token, offered.length),
      html: html ? fillTastingLinks(html, token, offered.length) : undefined,
    });
  } catch (err) {
    logger.error(`Quote email for ${eventId} failed`, err);
    if (token) await db.doc(`tastings/${token}`).delete().catch(() => {});
    throw new HttpsError("internal", "Gmail didn't take the email. Nothing was sent; try again in a minute.");
  }
  const lines = [{ at: Date.now(), type: "quote-sent", text: `Quote emailed to ${to}` }];
  if (offered.length) lines.push({ at: Date.now(), type: "note", text: `Offered tasting times: ${offered.map((t) => tastingWhen(t, { short: true })).join(", ")}` });
  await ref.update({
    ...(event.status === "inquiry" ? { status: "quoted" } : {}),
    quoteEmailedAt: FieldValue.serverTimestamp(),
    ...(token ? { "tasting.token": token, "tasting.offered": offered, "tasting.picked": FieldValue.delete() } : {}),
    history: FieldValue.arrayUnion(...lines),
    updatedAt: FieldValue.serverTimestamp(),
  });
  logger.info(`Quote emailed for ${eventId}${offered.length ? ` with ${offered.length} tasting times` : ""}`);
  return { ok: true, to };
});

// ---------- The /tasting page ----------

const tastingDoc = async (token) => {
  if (!/^[0-9a-f]{24}$/.test(String(token || ""))) throw new HttpsError("not-found", "This link doesn't work. Reply to the email and we'll sort it out.");
  const ref = getFirestore().doc(`tastings/${token}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "This link doesn't work. Reply to the email and we'll sort it out.");
  return { ref, t: snap.data() };
};

const firstName = (name) => {
  const n = String(name || "").trim();
  return /\s(and|&)\s/i.test(n) ? n : n.split(/\s+/)[0] || "";
};

export const tastingInfo = onCall({ invoker: "public" }, async (request) => {
  const { t } = await tastingDoc((request.data || {}).token);
  // In the order they were offered (the email's buttons use the same index);
  // past times are marked closed.
  const open = new Set(cleanTimes(t.times));
  return {
    name: firstName(t.name),
    picked: t.picked || null,
    minutes: t.minutes || 60,
    times: (t.times || []).map((at) => ({ at, open: !t.picked && open.has(at) })),
  };
});

// Calendar entry for a picked tasting (needs "Make changes to events" sharing).
const addTastingToCalendar = async (token, t, at, place) => {
  const calendarId = await calendarIdNow();
  const start = new Date(at);
  const end = new Date(start.getTime() + (Number(t.minutes) || 60) * 60000);
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken(["https://www.googleapis.com/auth/calendar.events"])}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      id: `ta${token}`, // hex, so a valid Google id; one entry per tasting link
      summary: `Tasting: ${t.name || "wedding couple"}`,
      location: place || "",
      description: `Pizza tasting (free).\n${t.email}\nOpen in Events: ${SITE}${eventLink(t.eventId)}`,
      start: { dateTime: start.toISOString(), timeZone: TZ },
      end: { dateTime: end.toISOString(), timeZone: TZ },
      extendedProperties: { private: { byboTasting: token, byboEvent: t.eventId } },
    }),
  });
  if (!res.ok && res.status !== 409) throw new Error(`calendar ${res.status} ${(await res.text()).slice(0, 200)}`);
  return `ta${token}`;
};

export const pickTasting = onCall({ invoker: "public", secrets: [GMAIL_APP_PASSWORD] }, async (request) => {
  const { token, at } = request.data || {};
  const { ref, t } = await tastingDoc(token);
  const d = new Date(at);
  const iso = Number.isNaN(d.getTime()) ? "" : d.toISOString();
  const db = getFirestore();

  const picked = await db.runTransaction(async (tx) => {
    const cur = (await tx.get(ref)).data();
    if (cur.picked) return { already: cur.picked };
    if (!iso || !cleanTimes(cur.times).includes(iso)) throw new HttpsError("failed-precondition", "That time isn't available anymore. Reply to the email and we'll find another.");
    tx.update(ref, { picked: iso, pickedAt: FieldValue.serverTimestamp() });
    tx.update(db.doc(`events/${cur.eventId}`), {
      "tasting.picked": iso,
      history: FieldValue.arrayUnion({ at: Date.now(), type: "contact", text: `Picked a tasting: ${tastingWhen(iso, { short: true })}` }),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { now: iso };
  });
  if (picked.already) return { picked: picked.already, already: true };

  // Everything below is extra: a failure here never undoes the pick.
  const settings = await tastingSettings();
  const jobs = [
    sendMail({ to: t.email, replyTo: GMAIL_USER, ...appendSignature(renderTastingEmail(settings.confirm, { name: t.name, at: iso, place: settings.place, minutes: t.minutes }), settings.signature) }),
    sendPush({ title: `Tasting booked: ${t.name || "a couple"}`, body: tastingWhen(iso), link: eventLink(t.eventId), tag: `tasting-${token}` }),
    addTastingToCalendar(token, t, iso, settings.place).then((calendarId) => ref.update({ calendarId })),
  ];
  const results = await Promise.allSettled(jobs);
  results.forEach((r, i) => r.status === "rejected" && logger.error(`pickTasting: ${["confirmation email", "notification", "calendar"][i]} failed`, r.reason));
  return { picked: iso };
});

// ---------- Day-before reminder (notificationTimer, every 15 minutes) ----------

export const tastingsToRemind = (docs, now = new Date()) => {
  const tomorrow = utahDay(new Date(now.getTime() + 24 * 3600000));
  return docs.filter(({ t }) => t.picked && !t.reminderSent && utahDay(t.picked) === tomorrow);
};

export const runTastingReminders = async (now = new Date()) => {
  if (utahHour(now) < 9) return;
  const db = getFirestore();
  const snap = await db.collection("tastings").where("picked", ">=", new Date(now.getTime()).toISOString()).get();
  const due = tastingsToRemind(snap.docs.map((d) => ({ ref: d.ref, t: d.data() })), now);
  if (!due.length) return;
  const settings = await tastingSettings();
  for (const { ref, t } of due) {
    await sendMail({ to: t.email, replyTo: GMAIL_USER, ...appendSignature(renderTastingEmail(settings.reminder, { name: t.name, at: t.picked, place: settings.place, minutes: t.minutes }), settings.signature) });
    await ref.update({ reminderSent: FieldValue.serverTimestamp() });
    logger.info(`Tasting reminder sent for ${t.eventId}`);
  }
};
