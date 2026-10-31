// Dough planner: copies the recipe, menu and recent Pizza Friday numbers from
// Google Sheets into Firestore (`planner/ref`), so staff can use the planner
// without access to the sheets.
//
// Sheets are read as this function's service account. Share each sheet
// (view only) with that account's email; a failed read says which email to use.
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) initializeApp();

const TRACKER = "1osNU39tVU3GrkrgSiR7Mw1kdE6ErDxnu5R3nu0K0izQ"; // money tracker
const DOUGH = "1XXguNl452UEv8s_dmo35Jzwr8M9kQ2Vvn98qoT5SL3o"; // dough calculator
const MENU = "1s27EIGl6zKq78czysmHNdmjGGOrK8JhGfcr-V6FO6WE"; // pizza selection

// Only these ranges are read. From the money tracker that is dough counts,
// "could have sold more", event name and date: no money columns.
const RANGES = {
  counts: [TRACKER, "Form Responses!B1:D"],
  meta: [TRACKER, "Form Responses!J1:L"],
  recipe: [DOUGH, "dough recipe!A1:B12"],
  settings: [DOUGH, "Planner settings!A1:B"],
  menu: [MENU, "pizzas!A1:E"],
  amounts: [MENU, "Topping amounts!A1:G"],
  sauces: [MENU, "Sauce recipes!A1:C"],
  sections: [MENU, "Store sections!A1:C"],
};

const METADATA = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default";

const metadata = async (path) => {
  const res = await fetch(`${METADATA}/${path}`, { headers: { "Metadata-Flavor": "Google" } });
  if (!res.ok) throw new Error(`metadata ${path}: ${res.status}`);
  return res;
};

const accessToken = async () => {
  const res = await metadata("token?scopes=https://www.googleapis.com/auth/spreadsheets.readonly");
  return (await res.json()).access_token;
};

const serviceAccountEmail = async () => {
  try {
    return (await (await metadata("email")).text()).trim();
  } catch (e) {
    return "this project's Cloud Functions service account";
  }
};

const readRange = async (token, [spreadsheetId, range]) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 403 || res.status === 404) {
    const err = new Error(`Can't read ${range}`);
    err.denied = true;
    throw err;
  }
  if (!res.ok) throw new Error(`Sheets ${range}: ${res.status} ${await res.text()}`);
  return (await res.json()).values || [];
};

const num = (v) => {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[$,%\s]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const iso = (v) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(v || "").trim());
  return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : null;
};

// Same shape the planner page reads. Keep in sync with src/pages/Planner/planner.js.
export const buildRef = (v) => {
  const counts = v.counts.slice(1);
  const nights = v.meta
    .slice(1)
    .map((m, i) => {
      const c = counts[i] || [];
      return {
        event: (m[1] || "").trim(),
        date: iso(m[2]),
        more: num(m[0]) || 0,
        dough_made: num(c[0]),
        sold: num(c[1]),
        comped: num(c[2]) || 0,
      };
    })
    .filter((r) => r.event === "Pizza Friday" && r.date && r.sold > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6)
    .map((r) => ({
      date: r.date,
      dough_made: r.dough_made,
      sold: r.sold,
      comped: r.comped,
      more: r.more,
      demand: r.sold + r.comped + r.more,
    }));
  return {
    recipe: v.recipe.slice(1).filter((r) => r[0]).map((r) => ({ item: String(r[0]).trim(), amount: num(r[1]) || 0 })),
    settings: v.settings.slice(1).filter((r) => r[0]).map((r) => ({ setting: String(r[0]).trim(), value: num(r[1]) })),
    menu: v.menu
      .slice(1)
      .filter((r) => r[0])
      .map((r) => ({
        name: String(r[0]).trim(),
        toppings: String(r[1] || ""),
        active: String(r[4] || "").toUpperCase() === "TRUE",
      }))
      .filter((p) => p.active),
    amounts: v.amounts
      .slice(1)
      .filter((r) => r[0])
      .map((r) => ({
        topping: String(r[0]).trim(),
        grams: num(r[1]),
        prep: String(r[3] || "").trim(),
        gpq: num(r[5]),
        box: num(r[6]),
      })),
    sauces: v.sauces
      .slice(1)
      .filter((r) => r[0] && r[1])
      .map((r) => ({ sauce: String(r[0]).trim(), ingredient: String(r[1]).trim(), grams: num(r[2]) || 0 })),
    sections: v.sections
      .slice(1)
      .filter((r) => r[0] && r[1])
      .map((r) => ({ ingredient: String(r[0]).trim(), section: String(r[1]).trim(), buyAs: String(r[2] || "").trim() })),
    nights,
  };
};

// Read every range, and write planner/ref only when something changed.
const refresh = async () => {
  const token = await accessToken();
  const keys = Object.keys(RANGES);
  let answers;
  try {
    answers = await Promise.all(keys.map((k) => readRange(token, RANGES[k])));
  } catch (e) {
    if (e.denied) {
      const email = await serviceAccountEmail();
      throw new HttpsError(
        "failed-precondition",
        `${e.message}. Share the money tracker, Dough calculator and pizza selection sheets (view only) with ${email}.`
      );
    }
    throw e;
  }
  const values = {};
  keys.forEach((k, i) => {
    values[k] = answers[i];
  });
  const ref = buildRef(values);
  const docRef = getFirestore().doc("planner/ref");
  const current = (await docRef.get()).data();
  const same = current && JSON.stringify({ ...current, at: 0 }) === JSON.stringify({ ...ref, at: 0 });
  if (!same) await docRef.set({ ...ref, at: Date.now() });
  return { changed: !same };
};

const isAdmin = async (email) => {
  if (!email) return false;
  const team = (await getFirestore().doc("plannerAccess/team").get()).data() || {};
  return (team.admins || []).map((e) => String(e).toLowerCase()).includes(email.toLowerCase());
};

// "Refresh from sheets" on the planner page. Admins only.
export const refreshPlannerData = onCall(async (request) => {
  const email = request.auth?.token?.email;
  if (!request.auth?.token?.email_verified || !(await isAdmin(email))) {
    throw new HttpsError("permission-denied", "Only planner admins can refresh from the sheets.");
  }
  try {
    return await refresh();
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    logger.error("Planner refresh failed", e);
    throw new HttpsError("internal", "Couldn't read the sheets right now. Showing the last saved copy.");
  }
});

// Keep the copy current without anyone tapping refresh.
export const refreshPlannerHourly = onSchedule(
  { schedule: "every 60 minutes", timeZone: "America/Denver" },
  async () => {
    try {
      const { changed } = await refresh();
      logger.info(`Planner refresh: ${changed ? "updated" : "no changes"}`);
    } catch (e) {
      logger.error("Scheduled planner refresh failed", e);
    }
  }
);
