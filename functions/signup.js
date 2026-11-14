// /hello email sign-ups (QR code on event posters), reached at /api/signup
// (firebase.json rewrite), like sendInquiry.
//
// signups/{id}: name (optional first name), email, source ("hello"), createdAt.
// The id comes from the email, so signing up twice keeps the first one. Admins
// read the list at /admin/signups; only this function writes it (firestore.rules).
// A new sign-up gets a welcome email (welcomeText.js) from the business Gmail,
// at most WELCOME_DAILY_CAP a day (counted in signupStats/{day}) so a big event
// can't use up Gmail's daily sending limit; past the cap they're still added.
// The sign-up is saved either way; signups/{id}.welcomed says whether it went.
import { createHash } from "node:crypto";
import { onRequest } from "firebase-functions/v2/https";
import logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { checkSignup } from "./signupText.js";
import { GMAIL_APP_PASSWORD, sendMail } from "./mail.js";
import { WELCOME_DAILY_CAP, utahDay, welcomeEmail } from "./welcomeText.js";

if (!getApps().length) initializeApp();

export const signupId = (email) => createHash("sha256").update(email).digest("hex").slice(0, 24);

// Claims one of today's welcome emails; false once the day's cap is used.
const claimWelcome = async (db) => {
  const ref = db.doc(`signupStats/${utahDay()}`);
  return db.runTransaction(async (tx) => {
    const sent = ((await tx.get(ref)).data() || {}).welcomes || 0;
    if (sent >= WELCOME_DAILY_CAP) return false;
    tx.set(ref, { welcomes: sent + 1 }, { merge: true });
    return true;
  });
};

const sendWelcome = async (ref, name, email) => {
  const db = getFirestore();
  try {
    if (!(await claimWelcome(db))) {
      logger.warn("Welcome email skipped: daily cap reached");
      return;
    }
    await sendMail({ to: email, ...welcomeEmail(name) });
    await ref.update({ welcomed: true });
  } catch (err) {
    // The sign-up is saved; a missed welcome is fine.
    logger.warn("Welcome email failed", err);
  }
};

export const sendSignup = onRequest({ secrets: [GMAIL_APP_PASSWORD], cors: true, region: "us-central1" }, async (req, res) => {
  if (req.method !== "POST") {
    res.set("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const body = req.body || {};
  // Honeypot: bots fill hidden fields. Pretend it worked and drop it.
  if (body._gotcha) {
    logger.info("Signup honeypot triggered — dropping");
    return res.status(200).json({ ok: true });
  }
  const checked = checkSignup(body);
  if (checked.error) return res.status(400).json({ error: checked.error });

  const ref = getFirestore().doc(`signups/${signupId(checked.email)}`);
  try {
    const already = await getFirestore().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) return true;
      tx.create(ref, { name: checked.name, email: checked.email, source: "hello", welcomed: false, createdAt: FieldValue.serverTimestamp() });
      return false;
    });
    logger.info(`Signup ${already ? "repeated" : "saved"}`);
    if (!already) await sendWelcome(ref, checked.name, checked.email);
    return res.status(200).json({ ok: true, already });
  } catch (err) {
    logger.error("Failed to save signup", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});
