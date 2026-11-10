// /hello sign-ups (QR code on event posters): first name + phone or email,
// saved to Firestore signups/{id}, and the visitor gets a $1-off code.
// Reached at /api/signup (firebase.json rewrite), like sendInquiry.
//
// signups/{id}: name, contact ("+18015551234" or an email), contactType
// ("phone" | "email"), consent (agreed to texts; always false for email),
// consentText (the exact words they agreed to), source ("hello"), code,
// createdAt. The id comes from the contact, so signing up twice gives back the
// same code instead of a second one. Admins read the list under Events >
// Signups; only this function writes it (firestore.rules).
import { createHash, randomInt } from "node:crypto";
import { onRequest } from "firebase-functions/v2/https";
import logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { GMAIL_APP_PASSWORD, GMAIL_USER, sendMail } from "./mail.js";
import { TEXT_CONSENT, checkSignup, newCode, prettyPhone } from "./signupText.js";

if (!getApps().length) initializeApp();

export const signupId = (contact) => createHash("sha256").update(contact).digest("hex").slice(0, 24);

export const sendSignup = onRequest(
  { secrets: [GMAIL_APP_PASSWORD], cors: true, region: "us-central1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.set("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }
    const body = req.body || {};
    // Honeypot: bots fill hidden fields. Pretend it worked and drop it.
    if (body._gotcha) {
      logger.info("Signup honeypot triggered — dropping");
      return res.status(200).json({ ok: true, code: newCode() });
    }

    const checked = checkSignup(body);
    if (checked.error) return res.status(400).json({ error: checked.error });
    const { name, type, contact, consent } = checked;

    const ref = getFirestore().doc(`signups/${signupId(contact)}`);
    let result;
    try {
      result = await getFirestore().runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists) return { code: snap.get("code"), already: true };
        const code = newCode(() => randomInt(1000000) / 1000000);
        tx.create(ref, {
          name,
          contact,
          contactType: type,
          consent,
          ...(consent ? { consentText: TEXT_CONSENT } : {}),
          source: "hello",
          code,
          createdAt: FieldValue.serverTimestamp(),
        });
        return { code, already: false };
      });
    } catch (err) {
      logger.error("Failed to save signup", err);
      return res.status(500).json({ error: "Something went wrong. Please try again." });
    }

    if (!result.already) {
      const shown = type === "phone" ? prettyPhone(contact) : contact;
      const texts = type === "phone" ? (consent ? "OK to text" : "no texts") : "email";
      try {
        await sendMail({
          to: GMAIL_USER,
          ...(type === "email" ? { replyTo: contact } : {}),
          subject: `New sign-up: ${name}`,
          text: `${name}\n${shown} (${texts})\nCode: ${result.code}\n\nSee everyone: https://backyardbrickovenpizza.com/events (Signups)\n`,
        });
      } catch (err) {
        // The sign-up is saved; a missed email is fine.
        logger.warn("Signup saved, notification email failed", err);
      }
    }
    logger.info(`Signup ${result.already ? "repeated" : "saved"}`);
    return res.status(200).json({ ok: true, code: result.code, already: result.already });
  }
);
