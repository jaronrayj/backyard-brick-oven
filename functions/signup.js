// /hello email sign-ups (QR code on event posters), reached at /api/signup
// (firebase.json rewrite), like sendInquiry.
//
// signups/{id}: name (optional first name), email, source ("hello"), createdAt.
// The id comes from the email, so signing up twice keeps the first one. Admins
// read the list at /admin/signups; only this function writes it (firestore.rules).
// No email per sign-up: a busy event could bring in dozens.
import { createHash } from "node:crypto";
import { onRequest } from "firebase-functions/v2/https";
import logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { checkSignup } from "./signupText.js";

if (!getApps().length) initializeApp();

export const signupId = (email) => createHash("sha256").update(email).digest("hex").slice(0, 24);

export const sendSignup = onRequest({ cors: true, region: "us-central1" }, async (req, res) => {
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
      tx.create(ref, { name: checked.name, email: checked.email, source: "hello", createdAt: FieldValue.serverTimestamp() });
      return false;
    });
    logger.info(`Signup ${already ? "repeated" : "saved"}`);
    return res.status(200).json({ ok: true, already });
  } catch (err) {
    logger.error("Failed to save signup", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});
