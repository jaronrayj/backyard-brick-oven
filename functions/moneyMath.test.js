import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_MONEY, settingsFrom, pendingRows, splitMoney, stampOf, rowId, nextTransferDay, isTransferDay } from "./moneyMath.js";

const headers = [
  "Timestamp",
  "How much venmo?",
  "How much cash?",
  "Pizza Friday or event?",
  "Date of event",
  "Tip money?",
  "How much simpleswipe?",
];
const grid = [
  ["10/30/2026 20:37:44", "246", "30", "Pizza Friday", "10/30/2026", "10", ""], // before the start date
  ["11/6/2026 20:00:00", "332", "70", "Pizza Friday", "11/6/2026", "10", "1,000"],
  ["11/9/2026 12:00:00", "150", "", "ENB", "11/9/2026", "", ""],
  ["11/11/2026 9:00:00", "", "", "Prep", "11/11/2026", "", ""], // no money
  ["", "500", "", "Pizza Friday", "11/12/2026", "", ""], // no timestamp
];

test("settingsFrom fills in the starting percentages", () => {
  const s = settingsFrom(undefined);
  assert.deepEqual(s.splits.pizza, { materials: 15, profit: 2, owner: 30, tax: 15 });
  assert.deepEqual(s.splits.enb, { materials: 0, profit: 0, owner: 85, tax: 15 });
  assert.equal(s.startDate, "2026-11-01");
  assert.equal(settingsFrom({ splits: { pizza: { profit: 5 } } }).splits.pizza.owner, 30);
  assert.equal(settingsFrom({ splits: { pizza: { profit: 5 } } }).splits.pizza.profit, 5);
});

test("pendingRows counts Venmo, cash and card but not tips, from the start date, by group", () => {
  const rows = pendingRows(headers, grid, {}, DEFAULT_MONEY);
  assert.deepEqual(
    rows.map((r) => [r.date, r.group, r.pending]),
    [
      ["2026-11-06", "pizza", 1402],
      ["2026-11-09", "enb", 150],
    ]
  );
});

test("pendingRows leaves out what was already moved and adds money added later", () => {
  const counted = { [rowId(grid[1][0])]: 1402, [rowId(grid[2][0])]: 100 };
  const rows = pendingRows(headers, grid, counted, DEFAULT_MONEY);
  assert.deepEqual(rows.map((r) => [r.name, r.pending]), [["ENB", 50]]);
});

test("ENB means a name starting with ENB, any case", () => {
  const g = [["11/9/2026 12:00:00", "100", "", "enb hot springs", "11/9/2026", "", ""]];
  assert.equal(pendingRows(headers, g, {}, DEFAULT_MONEY)[0].group, "enb");
  const h = [["11/9/2026 12:00:00", "100", "", "Wendy's party", "11/9/2026", "", ""]];
  assert.equal(pendingRows(headers, h, {}, DEFAULT_MONEY)[0].group, "pizza");
});

test("splitMoney takes ingredients off first, then splits the rest", () => {
  const out = splitMoney([{ group: "pizza", pending: 1000 }], DEFAULT_MONEY);
  assert.deepEqual(out.groups.pizza, { deposits: 1000, materials: 150, profit: 17, owner: 255, tax: 127.5, opex: 450.5 });
  assert.deepEqual(out.transfers, { profit: 17, owner: 255, tax: 127.5 });
  assert.equal(out.stays, 600.5);
});

test("splitMoney sends ENB to owner's pay and tax only", () => {
  const out = splitMoney([{ group: "enb", pending: 200 }], DEFAULT_MONEY);
  assert.deepEqual(out.groups.enb, { deposits: 200, materials: 0, profit: 0, owner: 170, tax: 30, opex: 0 });
  assert.deepEqual(out.transfers, { profit: 0, owner: 170, tax: 30 });
});

test("splitMoney rounds to cents and adds the groups together", () => {
  const out = splitMoney(
    [
      { group: "pizza", pending: 333.33 },
      { group: "enb", pending: 99.99 },
    ],
    DEFAULT_MONEY
  );
  assert.equal(out.transfers.tax, Math.round((333.33 * 0.85 * 0.15 + 99.99 * 0.15) * 100) / 100);
  const g = out.groups.pizza;
  assert.equal(Math.round((g.materials + g.profit + g.owner + g.tax + g.opex) * 100) / 100, 333.33);
});

test("stampOf changes when any pending amount changes", () => {
  const a = stampOf([{ id: "x", pending: 10 }]);
  assert.notEqual(stampOf([{ id: "x", pending: 11 }]), a);
  assert.equal(stampOf([{ id: "x", pending: 10 }]), a);
});

test("transfer days are the 10th and 25th", () => {
  assert.equal(isTransferDay("2026-11-10"), true);
  assert.equal(isTransferDay("2026-11-25"), true);
  assert.equal(isTransferDay("2026-11-13"), false);
  assert.equal(nextTransferDay("2026-11-13"), "2026-11-25");
  assert.equal(nextTransferDay("2026-11-25"), "2026-11-25");
  assert.equal(nextTransferDay("2026-11-26"), "2026-12-10");
  assert.equal(nextTransferDay("2026-12-26"), "2027-01-10");
});
