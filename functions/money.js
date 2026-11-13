// Money page (/money): Profit First transfers from the wrap-ups in the money
// tracker. Shows what to move since the last transfer, records it when it's
// been moved, and sends a reminder on the 10th and 25th. The math is in
// moneyMath.js; see docs/money.md. The site never touches the bank: the
// transfers are made by hand in the bank's app.
//
// Firestore:
//   eventSettings/money   percentages and start date (the page edits them;
//                         the server adds sentOn for the reminder)
//   moneyCounted/state    { rows: {rowId: amount moved} } (server only)
//   moneyMoves/{id}       one per "Mark as moved" (server only)
import { onCall, HttpsError } from "firebase-functions/v2/https";
import logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { requireRole } from "./team.js";
import { readTracker } from "./wrapup.js";
import { sendPush } from "./push.js";
import { todayLocal, timesFrom, minutesPast } from "./events.js";
import { settingsFrom, pendingRows, splitMoney, stampOf, isTransferDay, nextTransferDay } from "./moneyMath.js";

if (!getApps().length) initializeApp();

const requireAdmin = (request) => requireRole(request, ["admin"], "Only admins can see the money page.");

const dollars = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Everything still to move, worked out fresh from the sheet.
const current = async () => {
  const db = getFirestore();
  const [settingsSnap, countedSnap, tracker] = await Promise.all([
    db.doc("eventSettings/money").get(),
    db.doc("moneyCounted/state").get(),
    readTracker(),
  ]);
  const settings = settingsFrom(settingsSnap.data());
  const counted = (countedSnap.data() || {}).rows || {};
  const rows = pendingRows(tracker.headers, tracker.grid, counted, settings);
  return { settings, rows, split: splitMoney(rows, settings), stamp: stampOf(rows) };
};

export const moneyToMove = onCall({ invoker: "public" }, async (request) => {
  await requireAdmin(request);
  const today = todayLocal();
  try {
    const { settings, rows, split, stamp } = await current();
    const moves = await getFirestore().collection("moneyMoves").orderBy("at", "desc").limit(6).get();
    return {
      settings,
      rows: rows.map(({ id, date, name, group, pending }) => ({ id, date, name, group, pending })),
      split,
      stamp,
      today,
      nextDay: nextTransferDay(today),
      moves: moves.docs.map((d) => {
        const m = d.data();
        return { id: d.id, at: m.at ? m.at.toDate().toISOString() : "", by: m.by || "", transfers: m.transfers, deposits: m.deposits };
      }),
    };
  } catch (e) {
    logger.error("Money: couldn't work out the transfers", e);
    throw new HttpsError("internal", "Couldn't read the money tracker. Try again.");
  }
});

// After the transfers are made in the bank: count these wrap-ups as moved.
// stamp is what the page showed; if new money came in since, nothing is
// recorded and the page reloads with the new amounts.
export const markMoneyMoved = onCall({ invoker: "public" }, async (request) => {
  await requireAdmin(request);
  const { stamp } = request.data || {};
  const { rows, split, stamp: now } = await current();
  if (!rows.length) throw new HttpsError("failed-precondition", "Nothing is waiting to move.");
  if (stamp !== now) throw new HttpsError("failed-precondition", "New money came in since you opened this. Check the new amounts and try again.");
  const db = getFirestore();
  const countedRef = db.doc("moneyCounted/state");
  await db.runTransaction(async (tx) => {
    const counted = ((await tx.get(countedRef)).data() || {}).rows || {};
    const next = { ...counted };
    for (const r of rows) next[r.id] = Math.round(((Number(next[r.id]) || 0) + r.pending) * 100) / 100;
    tx.set(countedRef, { rows: next });
    tx.create(db.collection("moneyMoves").doc(), {
      at: FieldValue.serverTimestamp(),
      by: request.auth.token.email,
      transfers: split.transfers,
      deposits: Math.round(rows.reduce((t, r) => t + r.pending, 0) * 100) / 100,
      rows: rows.map(({ id, date, name, pending }) => ({ id, date, name, pending })),
    });
  });
  logger.info(`Money marked as moved by ${request.auth.token.email}: ${JSON.stringify(split.transfers)}`);
  return { ok: true };
});

// The 10th and 25th, at the morning summary time: what to move. Run every 15
// minutes by notificationTimer; sends once per day, and only if there's money.
export const runMoneyDay = async () => {
  const today = todayLocal();
  if (!isTransferDay(today)) return;
  const db = getFirestore();
  const ref = db.doc("eventSettings/money");
  if (((await ref.get()).data() || {}).sentOn === today) return;
  const reminders = (await db.doc("eventSettings/reminders").get()).data() || {};
  if (minutesPast(timesFrom(reminders).morningTime) < 0) return;
  // Work it out first: if the sheet can't be read, the next run tries again.
  const { split } = await current();
  await ref.set({ sentOn: today }, { merge: true });
  const t = split.transfers;
  if (t.profit + t.owner + t.tax <= 0) {
    logger.info("Money day: nothing to move");
    return;
  }
  const lines = [
    t.profit > 0 && `${dollars(t.profit)} to Profit`,
    t.owner > 0 && `${dollars(t.owner)} to Owner's Pay`,
    t.tax > 0 && `${dollars(t.tax)} to Tax`,
  ].filter(Boolean);
  const n = await sendPush({
    title: "Transfer day",
    body: `${lines.join(", ")}. ${dollars(split.stays)} stays in checking.`,
    link: "/money",
    tag: `money-${today}`,
  });
  logger.info(`Money day reminder sent to ${n} phone(s)`);
};
