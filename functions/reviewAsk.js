// Morning-after thank-you + Google review email for booked events.
// The wording and rules are in reviewAskText.js (shared with the Events page
// preview). Run every 15 minutes by `notificationTimer` (functions/index.js);
// it does nothing before 9 am Utah time.
//
// Per event (events/{id}):
//   reviewAskSkip: true            - "Don't send" on the Events page
//   reviewAsk.sentAt / to / on     - written here once it went out
//   reviewAsk.noEmailOn            - no email on file: Jaron got a "text them" note instead
import logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { GMAIL_USER, sendMail } from "./mail.js";
import { sendPush } from "./push.js";
import { todayLocal } from "./events.js";
import { REVIEW_HOUR, reviewEmail, reviewSendDate, reviewState } from "./reviewAskText.js";

if (!getApps().length) initializeApp();

const TZ = "America/Denver";
// Catch up after a missed day or two, but never email about old events
// (for example everything already done when this was turned on).
const CATCH_UP_DAYS = 3;

const utahHour = (now) => Number(now.toLocaleString("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }));
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);

// Which events to act on today: [{ id, event, action: "send" | "noEmail" }]. Pure, for tests.
export const reviewAsksDue = (docs, today) =>
  docs
    .map(({ id, event }) => {
      const on = reviewSendDate(event.date);
      if (!on || on > today || daysBetween(on, today) > CATCH_UP_DAYS) return null;
      const state = reviewState(event);
      if (state === "waiting") return { id, event, action: "send" };
      if (state === "noEmail" && !(event.reviewAsk && event.reviewAsk.noEmailOn)) return { id, event, action: "noEmail" };
      return null;
    })
    .filter(Boolean);

export const runReviewAsks = async (now = new Date()) => {
  if (utahHour(now) < REVIEW_HOUR) return;
  const db = getFirestore();
  const today = todayLocal(now);
  const snap = await db.collection("events").where("status", "in", ["booked", "done"]).get();
  const due = reviewAsksDue(snap.docs.map((d) => ({ id: d.id, event: d.data() })), today);

  for (const { id, event, action } of due) {
    const ref = db.doc(`events/${id}`);
    if (action === "send") {
      const mail = reviewEmail(event);
      await sendMail({ ...mail, replyTo: GMAIL_USER });
      await ref.update({
        reviewAsk: { sentAt: FieldValue.serverTimestamp(), to: mail.to, on: today },
        history: FieldValue.arrayUnion({ at: Date.now(), type: "followup", text: `Review email sent to ${mail.to}` }),
      });
      logger.info(`Review email sent for ${id}`);
    } else {
      await sendPush({
        title: "Ask for a review",
        body: `No email on file for ${event.name || "yesterday's event"}. Text them the review link: backyardbrickovenpizza.com/review`,
        link: "/events",
        tag: `review-${id}`,
      });
      await ref.update({ "reviewAsk.noEmailOn": today });
      logger.info(`Review: no email for ${id}, sent a reminder instead`);
    }
  }
};
