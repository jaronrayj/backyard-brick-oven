// Converting wrap-ups between the money tracker's "Form Responses" cells and
// the wrap-up form's values. No Firebase here, so it can be tested on its own:
// `npm test` in this folder.

// Wrap-ups can be edited on the site for this many days after the event.
// Older ones are changed directly in the sheet.
export const EDIT_DAYS = 3;
const TZ = "America/Denver";

export const colName = (i) => {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

export const addDays = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// Columns the site fills, by header. Formula columns ("Column 1" etc.) are left alone.
export const writableHeaders = (headers) => {
  let last = -1;
  headers.forEach((h, i) => {
    if (String(h || "").trim() && !/^column \d+$/i.test(String(h).trim())) last = i;
  });
  return headers.slice(0, last + 1);
};

const isTimestamp = (h) => /^timestamp$/i.test(String(h || "").trim());
const isDate = (h) => /date of event/i.test(h);
const isTime = (h) => /what time/i.test(h);
const isName = (h) => /pizza friday or event/i.test(h);
const isText = (h) => /notes/i.test(h) || isName(h);

// "M/D/YYYY H:MM:SS" in Utah time, like a form timestamp.
export const sheetTimestamp = (now = new Date()) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    })
      .formatToParts(now)
      .map((x) => [x.type, x.value])
  );
  return `${p.month}/${p.day}/${p.year} ${p.hour}:${p.minute}:${p.second}`;
};
// "2026-10-30" -> "10/30/2026"
export const sheetDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  return m ? `${Number(m[2])}/${Number(m[3])}/${m[1]}` : String(iso || "");
};
// "18:35" -> "6:35 PM"
export const sheetTime = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ""));
  if (!m) return String(hhmm || "");
  const h = Number(m[1]);
  return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
};

// A form value as it goes into a cell.
const cellValue = (header, v) => {
  if (v == null || v === "") return "";
  if (isDate(header)) return sheetDate(v);
  if (isTime(header)) return sheetTime(v);
  return String(v);
};

// One row of values in header order. `values` is keyed by header text.
export const buildRow = (headers, values, now = new Date()) =>
  writableHeaders(headers).map((h) =>
    isTimestamp(h) ? sheetTimestamp(now) : cellValue(h, values[String(h || "").trim()])
  );

// A cell as the form holds it. Anything unreadable comes back untouched, so
// saving an edit can't change a cell nobody edited.
export const formValue = (header, cell) => {
  const s = cell == null ? "" : String(cell);
  if (isDate(header)) {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
    return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : s;
  }
  if (isTime(header)) {
    const m = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP])M$/i.exec(s.trim());
    if (!m) return s;
    const h = (Number(m[1]) % 12) + (m[3].toUpperCase() === "P" ? 12 : 0);
    return `${String(h).padStart(2, "0")}:${m[2]}`;
  }
  if (!isText(header) && /^\$?-?[\d,]+(\.\d+)?$/.test(s.trim())) return s.trim().replace(/[$,]/g, "");
  return s;
};

const cellFor = (headers, row, test) => row[headers.findIndex((h) => test(String(h || "")))] ?? "";

// What identifies a row: if its timestamp, date or event changes between
// opening the edit and saving it (the sheet was sorted, say), it's a different row.
export const rowKey = (headers, row) =>
  JSON.stringify([cellFor(headers, row, isTimestamp), cellFor(headers, row, isDate), cellFor(headers, row, isName)]);

export const isRecent = (isoDate, today, days = EDIT_DAYS) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(isoDate)) && isoDate >= addDays(today, -days);

export const rowDate = (headers, row) => formValue("Date of event", cellFor(headers, row, isDate));

// Wrap-ups whose event was in the last few days, newest first. `grid` is the
// tab's rows from row 2 down.
export const recentRows = (headers, grid, today) => {
  const cols = writableHeaders(headers);
  return grid
    .map((cells, i) => ({ cells, row: i + 2 }))
    .filter(({ cells }) => String(cells[0] || "").trim() && isRecent(rowDate(headers, cells), today))
    .map(({ cells, row }) => ({
      row,
      key: rowKey(headers, cells),
      date: rowDate(headers, cells),
      name: String(cellFor(headers, cells, isName)).trim(),
      values: Object.fromEntries(cols.map((h, i) => [String(h || "").trim(), formValue(h, cells[i])])),
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.row - a.row);
};

const sameValue = (a, b) => a === b || (a !== "" && b !== "" && Number(a) === Number(b));

// The cells an edit really changes, as [{col, value}]. Only those are written,
// so a sum typed into a cell (=482.14+50) stays unless its number changes.
export const changedCells = (headers, row, values) =>
  writableHeaders(headers).flatMap((h, i) => {
    const key = String(h || "").trim();
    if (!key || isTimestamp(key) || !Object.prototype.hasOwnProperty.call(values, key)) return [];
    const next = values[key] == null ? "" : String(values[key]);
    if (sameValue(formValue(key, row[i]), next)) return [];
    return [{ col: colName(i), value: cellValue(key, next) }];
  });
