// Visitor counts for the public site: Firestore `siteStats/{YYYY-MM}`, one
// number per step (see src/utils/track.js). Public, since visitors aren't
// signed in; it only accepts the known step names and adds 1.
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!getApps().length) initializeApp();

const STEPS = new Set([
  "visit",
  "inquiries_view",
  "pricing_seen",
  "quote_open",
  "quote_start",
  "quote_submit",
  "quote_abandon",
  "quote_error",
]);

export const monthKey = (d = new Date()) =>
  d.toLocaleDateString("en-CA", { timeZone: "America/Denver" }).slice(0, 7);

export const countStep = onCall({ invoker: "public" }, async (request) => {
  const step = String((request.data || {}).step || "");
  if (!STEPS.has(step)) throw new HttpsError("invalid-argument", "Unknown step.");
  await getFirestore()
    .doc(`siteStats/${monthKey()}`)
    .set({ [step]: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { ok: true };
});
