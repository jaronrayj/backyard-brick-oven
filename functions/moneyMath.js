// Profit First math for the Money page (functions/money.js). No Firebase here,
// so it's tested on its own: `npm test` in this folder.
//
// Money in is Venmo + cash + card from each wrap-up (tips belong to the staff,
// so they're left out). Pizza money has ingredients taken off first; the rest
// ("real revenue") is split by percentage. ENB money (event names starting
// with "ENB") has its own split. Operating expenses are whatever is left and,
// like ingredients, stay in checking. Only Profit, Owner's Pay and Tax move.
import { formValue } from "./wrapupRows.js";

export const DEFAULT_MONEY = {
  // Wrap-ups before this date aren't counted (money from before the Money page).
  startDate: "2026-11-01",
  splits: {
    pizza: { materials: 15, profit: 2, owner: 30, tax: 15 },
    enb: { materials: 0, profit: 0, owner: 85, tax: 15 },
  },
};
export const GROUPS = ["pizza", "enb"];
const PARTS = ["materials", "profit", "owner", "tax"];

const pct = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : fallback;
};

// Firestore eventSettings/money over the defaults.
export const settingsFrom = (doc) => {
  const d = doc || {};
  const splits = {};
  for (const g of GROUPS) {
    const saved = (d.splits && d.splits[g]) || {};
    splits[g] = Object.fromEntries(PARTS.map((p) => [p, pct(saved[p], DEFAULT_MONEY.splits[g][p])]));
  }
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(String(d.startDate || "")) ? d.startDate : DEFAULT_MONEY.startDate;
  return { startDate, splits };
};

// A wrap-up row's id: its form timestamp, which edits never change. Made safe
// as a Firestore map key (no dots or slashes).
export const rowId = (timestamp) => encodeURIComponent(String(timestamp).trim()).replace(/\./g, "%2E");

const cents = (n) => Math.round(n * 100) / 100;
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const col = (headers, re) => headers.findIndex((h) => re.test(String(h || "")));

// Wrap-ups with money not yet moved: [{id, date, name, group, income, pending}].
// counted: {rowId: amount already moved}. Money added to a row after it was
// moved shows up as its own pending amount.
export const pendingRows = (headers, grid, counted, settings) => {
  const at = {
    ts: col(headers, /^timestamp$/i),
    date: col(headers, /date of event/i),
    name: col(headers, /pizza friday or event/i),
  };
  const moneyCols = headers
    .map((h, i) => (/venmo|cash|simpleswipe/i.test(String(h || "")) && !/tip/i.test(String(h || "")) ? i : -1))
    .filter((i) => i >= 0);
  return grid
    .map((cells) => {
      const ts = String(cells[at.ts] || "").trim();
      const date = formValue("Date of event", cells[at.date]);
      const name = String(cells[at.name] || "").trim();
      const income = cents(moneyCols.reduce((t, i) => t + num(formValue(headers[i], cells[i])), 0));
      const id = rowId(ts);
      return { id, ts, date, name, group: /^enb\b/i.test(name) ? "enb" : "pizza", income, pending: cents(income - num((counted || {})[id])) };
    })
    .filter((r) => r.ts && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && r.date >= settings.startDate && r.pending !== 0)
    .sort((a, b) => a.date.localeCompare(b.date));
};

// What to move: per group and in total. Transfers are Profit, Owner's Pay and
// Tax; ingredients and operating expenses stay in checking.
export const splitMoney = (rows, settings) => {
  const groups = {};
  for (const g of GROUPS) {
    const s = settings.splits[g];
    const deposits = cents(rows.filter((r) => r.group === g).reduce((t, r) => t + r.pending, 0));
    const materials = cents((deposits * s.materials) / 100);
    const real = deposits - materials;
    const profit = cents((real * s.profit) / 100);
    const owner = cents((real * s.owner) / 100);
    const tax = cents((real * s.tax) / 100);
    groups[g] = { deposits, materials, profit, owner, tax, opex: cents(deposits - materials - profit - owner - tax) };
  }
  const sum = (k) => cents(GROUPS.reduce((t, g) => t + groups[g][k], 0));
  return {
    groups,
    transfers: { profit: sum("profit"), owner: sum("owner"), tax: sum("tax") },
    stays: cents(sum("materials") + sum("opex")),
  };
};

// Fingerprint of what's pending, so "Mark as moved" records exactly what was shown.
export const stampOf = (rows) => JSON.stringify(rows.map((r) => [r.id, r.pending]));

// Profit First's 10/25 rule.
export const isTransferDay = (iso) => /-(10|25)$/.test(iso);
export const nextTransferDay = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  const pad = (n) => String(n).padStart(2, "0");
  if (d <= 10) return `${y}-${pad(m)}-10`;
  if (d <= 25) return `${y}-${pad(m)}-25`;
  return m === 12 ? `${y + 1}-01-10` : `${y}-${pad(m + 1)}-10`;
};
