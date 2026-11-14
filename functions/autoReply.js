// Automatic reply to a website inquiry, sent right after it's saved (sendInquiry
// in index.js). Wording: eventSettings/emails.autoReply, edited on the Events
// page under Emails (defaults in replyText.js). Only when the inquiry has an
// email address and the reply is turned on. Never stops the inquiry itself.
import logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { GMAIL_USER, sendMail } from "./mail.js";
import { inquiryToEvent } from "./events.js";
import { DEFAULT_AUTO_REPLY, renderAutoReply } from "./replyText.js";

if (!getApps().length) initializeApp();

export const sendAutoReply = async (body, eventId) => {
  try {
    const event = inquiryToEvent(body);
    if (!event.email) return false;
    const settings = (await getFirestore().doc("eventSettings/emails").get()).data() || {};
    const template = { ...DEFAULT_AUTO_REPLY, ...(settings.autoReply || {}) };
    if (template.on === false) return false;
    const mail = renderAutoReply(template, event);
    await sendMail({ to: event.email, replyTo: GMAIL_USER, ...mail });
    if (eventId) {
      await getFirestore()
        .doc(`events/${eventId}`)
        .update({ history: FieldValue.arrayUnion({ at: Date.now(), type: "followup", text: `Automatic reply sent to ${event.email}` }) });
    }
    logger.info("Automatic reply sent");
    return true;
  } catch (err) {
    logger.error("Automatic reply failed", err);
    return false;
  }
};
