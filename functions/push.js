// Phone notifications (web push through Firebase Cloud Messaging).
//
// A phone turns them on from /events ("Notifications"): the page asks the
// browser for permission, gets a push token and hands it to `registerPush`,
// which keeps it in Firestore `pushTokens/{id}` (server-only, no rules access).
// Only the emails in `eventSettings/notifications.emails` can sign up; with
// no list it's the business account alone.
//
// What gets sent:
//   - new website inquiries (sendInquiry)
//   - dough steps for booked events (runDoughReminders, with the email)
//   - a morning summary of today's calendar and dough steps (runMorningSummary)
//   - an evening nudge to wrap up today's events (runWrapUpReminder)
// Both times are set from the bell > Notification times (eventSettings/reminders).
import { createHash } from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { requireRole } from "./team.js";
import { GMAIL_USER } from "./mail.js";
import { dueSteps, mixLeadFrom, todayLocal, STEP_TEXT, timesFrom, minutesPast } from "./events.js";
import { calendarBetween, notWrappedUp } from "./wrapup.js";

if (!getApps().length) initializeApp();

const SITE = "https://backyardbrickovenpizza.com";
const TZ = "America/Denver";
const lower = (list) => (list || []).map((e) => String(e).trim().toLowerCase()).filter(Boolean);

const allowedEmails = async () => {
  const list = lower(((await getFirestore().doc("eventSettings/notifications").get()).data() || {}).emails);
  return list.length ? list : [GMAIL_USER];
};

// High urgency so a locked Android phone (Doze) shows it now instead of
// holding it until the screen comes on. TTL: a day; older than that is stale.
const URGENT = { Urgency: "high", TTL: "86400" };

const tokenId = (token) => createHash("sha256").update(token).digest("hex").slice(0, 40);

// { token, on } from the page. on=false forgets this phone.
export const registerPush = onCall({ invoker: "public" }, async (request) => {
  await requireRole(request, ["admin"], "Only admins can get notifications.");
  const email = String(request.auth.token.email || "").toLowerCase();
  const { token, on = true } = request.data || {};
  if (!token || typeof token !== "string") throw new HttpsError("invalid-argument", "No push token.");
  const ref = getFirestore().collection("pushTokens").doc(tokenId(token));
  if (!on) {
    await ref.delete();
    return { on: false };
  }
  if (!(await allowedEmails()).includes(email)) {
    throw new HttpsError("permission-denied", `Notifications are set up for ${(await allowedEmails()).join(", ")} only.`);
  }
  await ref.set({ token, email, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { on: true };
});

// Is this phone signed up? { token } -> { on }
export const pushStatus = onCall({ invoker: "public" }, async (request) => {
  await requireRole(request, ["admin"], "Only admins can get notifications.");
  const { token } = request.data || {};
  if (!token) return { on: false };
  const snap = await getFirestore().collection("pushTokens").doc(tokenId(token)).get();
  return { on: snap.exists };
});

// Send a test to just this device: { token, delay? } -> { ok, error? }
// delay (seconds, up to 30) gives time to lock the phone first.
export const testPush = onCall({ invoker: "public" }, async (request) => {
  await requireRole(request, ["admin"], "Only admins can get notifications.");
  const { token, delay = 0 } = request.data || {};
  if (!token) throw new HttpsError("invalid-argument", "No push token.");
  const wait = Math.min(Math.max(Number(delay) || 0, 0), 30);
  if (wait) await new Promise((r) => setTimeout(r, wait * 1000));
  try {
    await getMessaging().send({
      token,
      webpush: {
        headers: URGENT,
        notification: {
          title: "Test from Backyard Brick Oven",
          body: "Notifications are working on this device.",
          icon: `${SITE}/icon-192.png`,
          badge: `${SITE}/badge-96.png`,
          tag: "test",
        },
        fcmOptions: { link: `${SITE}/events` },
      },
    });
    return { ok: true };
  } catch (err) {
    logger.warn("Test push failed", err.code, err.message);
    return { ok: false, error: `${err.code || ""} ${err.message || err}`.trim() };
  }
});

// Send one notification to every signed-up phone whose email is still allowed.
// Never throws: a push problem must not stop the email that goes with it.
// tag: phones replace an older notification with the same tag.
export const sendPush = async ({ title, body, link = "/events", tag }) => {
  try {
    const db = getFirestore();
    const allowed = await allowedEmails();
    const snap = await db.collection("pushTokens").get();
    const docs = snap.docs.filter((d) => allowed.includes(d.data().email));
    if (!docs.length) return 0;
    const res = await getMessaging().sendEachForMulticast({
      tokens: docs.map((d) => d.data().token),
      webpush: {
        headers: URGENT,
        notification: {
          title,
          body,
          icon: `${SITE}/icon-192.png`,
          badge: `${SITE}/badge-96.png`,
          ...(tag ? { tag, renotify: true } : {}),
        },
        fcmOptions: { link: link.startsWith("http") ? link : `${SITE}${link}` },
      },
    });
    // Forget phones that uninstalled the app or turned notifications off.
    const gone = res.responses
      .map((r, i) => (!r.success && /registration-token-not-registered|invalid-registration-token|invalid-argument/.test(r.error?.code || "") ? docs[i].ref : null))
      .filter(Boolean);
    await Promise.all(gone.map((ref) => ref.delete()));
    res.responses.forEach((r) => !r.success && logger.warn("Push failed", r.error?.code, r.error?.message));
    return res.successCount;
  } catch (err) {
    logger.error("sendPush failed", err);
    return 0;
  }
};

// ---------- Morning summary ----------

const shortDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

// Run every 15 minutes by `notificationTimer` (functions/index.js).
export const runMorningSummary = async () => {
  {
    const db = getFirestore();
    const settingsRef = db.doc("eventSettings/reminders");
    const settings = (await settingsRef.get()).data() || {};
    const today = todayLocal();
    // Once a day, after the set time; skipped if it's over 3 hours late (no "morning" summary at night).
    const late = minutesPast(timesFrom(settings).morningTime);
    if (late < 0 || late > 180 || settings.morningSentOn === today) return;
    await settingsRef.set({ morningSentOn: today }, { merge: true });
    if (!(await db.collection("pushTokens").limit(1).get()).size) return;

    const lines = [];
    try {
      const { items } = await calendarBetween(today, today);
      for (const c of items.filter((x) => x.date === today)) {
        lines.push(`${c.time || "All day"}: ${c.title || "(no title)"}${c.location ? ` · ${c.location}` : ""}`);
      }
    } catch (e) {
      logger.error("Morning summary: calendar read failed", e);
      lines.push("(Couldn't read the calendar; see /events/wrapup)");
    }

    const mixLead = mixLeadFrom((await db.doc("planner/ref").get()).data());
    const booked = await db.collection("events").where("status", "==", "booked").get();
    for (const d of booked.docs) {
      const event = d.data();
      // Ignore remindersSent here: the summary is a heads-up, not the reminder.
      const steps = dueSteps({ ...event, remindersSent: {} }, today, mixLead);
      if (steps.length) lines.push(`${steps.map((s) => STEP_TEXT[s]).join(" and ")} for ${event.name} (${shortDate(event.date)})`);
      if (event.date === today) lines.push(`Event today: ${event.name}${event.time ? `, ${event.time}` : ""}`);
    }

    // Yesterday's events that still need a wrap-up.
    try {
      const left = await notWrappedUp([addDaysISO(today, -1)]);
      if (left.length) lines.push(`Still to wrap up: ${left.map((x) => x.title).join(", ")}`);
    } catch (e) {
      logger.error("Morning summary: wrap-up check failed", e);
    }

    if (!lines.length) {
      logger.info("Morning summary: nothing today");
      return;
    }
    const sent = await sendPush({ title: `Today · ${shortDate(today)}`, body: lines.join("\n"), link: "/events", tag: "morning" });
    logger.info(`Morning summary sent to ${sent} phone(s)`);
  }
};

// ---------- Wrap-up reminder ----------

const addDaysISO = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// After each event ends: 30 minutes after its calendar end time, or at the
// wrap-up time (default 9 pm) for all-day entries and events without a time.
// One nudge per event, only while it has no wrap-up. Run by notificationTimer.
const AFTER_END_MIN = 30;

export const runWrapUpReminder = async () => {
  const db = getFirestore();
  const settings = (await db.doc("eventSettings/reminders").get()).data() || {};
  const today = todayLocal();
  const sentRef = db.doc(`wrapUpReminders/${today}`);
  const sent = (await sentRef.get()).data() || {};
  if (!(await db.collection("pushTokens").limit(1).get()).size) return;

  const fallback = minutesPast(timesFrom(settings).wrapUpTime) >= 0;
  const now = Date.now();
  const due = (await notWrappedUp([today])).filter((x) => {
    if (sent[x.key]) return false;
    if (x.endsAt) return now >= new Date(x.endsAt).getTime() + AFTER_END_MIN * 60000;
    return fallback;
  });
  if (!due.length) return;
  await sentRef.set(Object.fromEntries(due.map((x) => [x.key, true])), { merge: true });
  const n = await sendPush({
    title: due.length === 1 ? `Wrap up ${due[0].title}` : `Wrap up ${due.length} events`,
    body: due.length === 1 ? "Log it to the money tracker while it's fresh." : due.map((x) => x.title).join(", "),
    link: "/events/wrapup",
    tag: "wrapup",
  });
  logger.info(`Wrap-up reminder (${due.map((x) => x.key).join(", ")}) sent to ${n} phone(s)`);
};
