import test from "node:test";
import assert from "node:assert/strict";
import { formValue, recentRows, rowKey, isRecent, changedCells, colName, buildRow } from "./wrapupRows.js";

const headers = [
  "Timestamp",
  "How much dough made?",
  "What time did we wrap up?",
  "Any holidays or events happening? Or other notes",
  "How much venmo?",
  "How much cash?",
  "Pizza Friday or event?",
  "Date of event",
];
const row = ["11/4/2026 15:43:50", "120", "6:35:00 PM", "Rainy", "1,246.50", "$30", "Pizza Friday", "11/4/2026"];

test("formValue turns sheet cells into what the form holds", () => {
  assert.equal(formValue("Date of event", "10/23/2026"), "2026-10-23");
  assert.equal(formValue("What time did we wrap up?", "7:00:00 PM"), "19:00");
  assert.equal(formValue("What time did we wrap up?", "12:05:00 AM"), "00:05");
  assert.equal(formValue("What time did we wrap up?", "12:30 PM"), "12:30");
  assert.equal(formValue("How much venmo?", "1,246.50"), "1246.50");
  assert.equal(formValue("How much cash?", "$30"), "30");
});

test("formValue leaves text and anything it can't read as it was", () => {
  assert.equal(formValue("Any holidays or events happening? Or other notes", "1,000"), "1,000");
  assert.equal(formValue("Pizza Friday or event?", "Todd party "), "Todd party ");
  assert.equal(formValue("My hours", "about 5"), "about 5");
  assert.equal(formValue("What time did we wrap up?", "late"), "late");
  assert.equal(formValue("Date of event", "sometime"), "sometime");
  assert.equal(formValue("My hours", undefined), "");
});

test("isRecent counts the last 3 days by event date", () => {
  assert.equal(isRecent("2026-11-06", "2026-11-06"), true);
  assert.equal(isRecent("2026-11-03", "2026-11-06"), true);
  assert.equal(isRecent("2026-11-02", "2026-11-06"), false);
  assert.equal(isRecent("2026-10-30", "2026-11-01"), true); // across a month
  assert.equal(isRecent("sometime", "2026-11-06"), false);
});

test("recentRows keeps real row numbers, drops old and blank rows, newest first", () => {
  const grid = [
    ["10/30/2026 20:37:44", "100", "", "", "", "", "Pizza Friday", "10/30/2026"],
    ["11/4/2026 15:43:50", "120", "", "", "", "", "Prep", "11/4/2026"],
    ["11/6/2026 20:00:00", "90", "", "", "", "", "Pizza Friday", "11/6/2026"],
    [],
    ["", "", "", "", "", "", "", "11/6/2026"],
  ];
  const rows = recentRows(headers, grid, "2026-11-06");
  assert.deepEqual(rows.map((r) => r.row), [4, 3]);
  assert.equal(rows[0].date, "2026-11-06");
  assert.equal(rows[0].name, "Pizza Friday");
  assert.equal(rows[0].values["How much dough made?"], "90");
  assert.equal(rows[0].key, rowKey(headers, grid[2]));
});

test("rowKey changes when the row's timestamp, date or event changes", () => {
  const base = rowKey(headers, row);
  assert.notEqual(rowKey(headers, ["other", ...row.slice(1)]), base);
  assert.notEqual(rowKey(headers, [...row.slice(0, 6), "Prep", row[7]]), base);
  assert.notEqual(rowKey(headers, [...row.slice(0, 7), "11/5/2026"]), base);
  assert.equal(rowKey(headers, [...row.slice(0, 4), "9", ...row.slice(5)]), base); // money isn't part of it
});

test("changedCells writes only what changed", () => {
  const same = Object.fromEntries(headers.map((h, i) => [h, formValue(h, row[i])]));
  assert.deepEqual(changedCells(headers, row, same), []);
  assert.deepEqual(changedCells(headers, row, { ...same, "How much venmo?": "1296.50" }), [
    { col: "E", value: "1296.50" },
  ]);
});

test("changedCells keeps a sum in the cell unless its number changes", () => {
  // The sheet shows 532.14 for =482.14+50, and the form sends the same number back.
  assert.deepEqual(changedCells(headers, [...row.slice(0, 5), "532.14"], { "How much cash?": "532.14" }), []);
  assert.deepEqual(changedCells(headers, [...row.slice(0, 5), "1,500.00"], { "How much cash?": "1500" }), []);
});

test("changedCells clears emptied fields and converts dates and times back", () => {
  assert.deepEqual(changedCells(headers, row, { "How much cash?": "" }), [{ col: "F", value: "" }]);
  assert.deepEqual(changedCells(headers, row, { "Date of event": "2026-11-05" }), [{ col: "H", value: "11/5/2026" }]);
  assert.deepEqual(changedCells(headers, row, { "What time did we wrap up?": "19:15" }), [
    { col: "C", value: "7:15 PM" },
  ]);
});

test("changedCells never touches the timestamp, formula columns or unsent fields", () => {
  const withFormula = [...headers, "Column 1"];
  assert.deepEqual(
    changedCells(withFormula, [...row, "2026"], { Timestamp: "x", "Column 1": "1999", "Not a column": "5" }),
    []
  );
});

test("colName handles columns past Z", () => {
  assert.equal(colName(0), "A");
  assert.equal(colName(23), "X");
  assert.equal(colName(26), "AA");
});

test("buildRow still fills a whole new row", () => {
  const out = buildRow(headers, { "Date of event": "2026-11-06", "What time did we wrap up?": "18:35", "How much cash?": 20 }, new Date("2026-11-06T20:00:00-07:00"));
  assert.deepEqual(out, ["11/6/2026 20:00:00", "", "6:35 PM", "", "", "20", "", "11/6/2026"]);
});
