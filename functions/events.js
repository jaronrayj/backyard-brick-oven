// Event tracker (/events): website inquiries become `events/{id}` documents,
// and a daily job emails dough reminders (poolish day, mix day) for booked
// events, with the forecast. The page's copy of the date and weather rules is
// src/pages/Events/schedule.js (the site and functions build separately);
// keep the two in step.
import { onSchedule } from "firebase-functions/v2/scheduler";
import logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { GMAIL_APP_PASSWORD, GMAIL_USER, sendMail } from "./mail.js";

if (!getApps().length) initializeApp();

const SITE = "https://backyardbrickovenpizza.com";
const TZ = "America/Denver";
// Mix day comes from the dough planner's "mix days before service" setting
// (Dough calculator sheet, copied into planner/ref); poolish goes in the
// evening before mix day, as on the planner. Default 2, like the planner.
export const mixLeadFrom = (ref) => {
  const row = ((ref && ref.settings) || []).find((x) => String(x.setting || "").toLowerCase() === "mix days before service");
  const v = row ? Number(row.value) : NaN;
  return Number.isFinite(v) && v >= 0 ? Math.min(5, v) : 2;
};

// ---------- Inquiry -> event ----------

// The inquiry form folds add-ons into the type ("Wedding + Salad, Pasta") and
// joins email and phone into `contact` ("a@b.com / 801…").
export const inquiryToEvent = (body) => {
  const s = (k) => String(body[k] || "").trim();
  const [type, addOnText = ""] = s("event_type").split(" + ");
  const contact = s("contact");
  const email = (/[^\s/]+@[^\s/]+\.[^\s/]+/.exec(contact) || [""])[0];
  const phone = contact
    .split("/")
    .map((p) => p.trim())
    .find((p) => p && p !== email && /\d{3}/.test(p)) || "";
  const guests = (/\d+/.exec(s("estimated_guests")) || [""])[0];
  return {
    status: "inquiry",
    source: "website",
    name: s("name"),
    email,
    phone,
    eventType: type.trim(),
    addOns: addOnText.split(",").map((a) => a.trim()).filter(Boolean),
    eventFor: s("event_for"),
    date: /^\d{4}-\d{2}-\d{2}$/.test(s("event_date")) ? s("event_date") : "",
    time: s("rough_event_time"),
    location: s("event_location"),
    guests: guests ? Number(guests) : "",
    guestsAsked: s("estimated_guests"),
    miles: "",
    heardAbout: s("heard_about"),
    comments: s("comments"),
    notes: "",
    quote: null,
  };
};

// Best effort: an inquiry still emails if this fails.
export const saveInquiryEvent = async (body) => {
  try {
    const event = inquiryToEvent(body);
    const geo = await geocode(event.location).catch(() => null);
    await getFirestore()
      .collection("events")
      .add({
        ...event,
        geo: geo ? { ...geo, from: event.location } : null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
  } catch (err) {
    logger.error("Couldn't save the inquiry to events", err);
  }
};

// ---------- Dates and weather ----------

const pad = (v) => String(v).padStart(2, "0");
const parseISO = (v) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || ""));
  return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
};
const toISO = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
export const addDays = (v, days) => {
  const d = parseISO(v);
  if (!d) return "";
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
};
// Today's date in Utah, YYYY-MM-DD.
export const todayLocal = (now = new Date()) => now.toLocaleDateString("en-CA", { timeZone: TZ });
const pretty = (v) => {
  const d = parseISO(v);
  return d ? d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }) : v;
};

const placeCandidates = (location) => {
  const text = String(location || "").trim();
  if (!text) return [];
  const parts = text
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !/^\d/.test(p) && !/^[A-Z]{2}(\s+\d{5})?$/i.test(p) && !/^(utah|usa|us|united states)$/i.test(p));
  return [...new Set([text, ...parts.reverse()])];
};

const geocode = async (location) => {
  for (const name of placeCandidates(location)) {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?count=1&countryCode=US&name=${encodeURIComponent(name)}`
    );
    if (!res.ok) continue;
    const hit = ((await res.json()).results || [])[0];
    if (hit) return { lat: hit.latitude, lon: hit.longitude, label: [hit.name, hit.admin1].filter(Boolean).join(", ") };
  }
  return null;
};

const CODES = [
  [[0], "Clear"],
  [[1, 2], "Partly cloudy"],
  [[3], "Overcast"],
  [[45, 48], "Fog"],
  [[51, 53, 55, 56, 57], "Drizzle"],
  [[61, 63, 65, 66, 67, 80, 81, 82], "Rain"],
  [[71, 73, 75, 77, 85, 86], "Snow"],
  [[95, 96, 99], "Thunderstorms"],
];

const forecastLine = async (geo, date) => {
  if (!geo) return "";
  const params = new URLSearchParams({
    latitude: geo.lat,
    longitude: geo.lon,
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,weather_code",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: TZ,
    start_date: date,
    end_date: date,
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) return "";
  const d = (await res.json()).daily || {};
  const at = (k) => (d[k] || [])[0];
  const low = Math.round(at("temperature_2m_min"));
  const high = Math.round(at("temperature_2m_max"));
  const rain = at("precipitation_probability_max");
  const wind = Math.round(at("wind_speed_10m_max"));
  const summary = (CODES.find(([list]) => list.includes(at("weather_code"))) || [null, ""])[1];
  const flags = [];
  if (low < 45) flags.push("cold: hard to stretch dough outside");
  if (rain >= 40) flags.push("rain likely: bring cover");
  if (wind >= 20) flags.push("windy: stake the canopy");
  if (high >= 95) flags.push("hot: watch toppings and dough");
  const line = [summary, `${low}–${high}°F`, rain != null ? `${rain}% rain` : "", wind ? `wind ${wind} mph` : ""]
    .filter(Boolean)
    .join(", ");
  return `${geo.label}: ${line}${flags.length ? ` (${flags.join("; ")})` : ""}`;
};

// ---------- Daily dough reminders ----------

// Which reminders are due today for a booked event: [] or ["poolish"], ["mix"].
export const dueSteps = (event, today, mixLead) => {
  const steps = [];
  if (!parseISO(event.date)) return steps;
  if (addDays(event.date, -(mixLead + 1)) === today) steps.push("poolish");
  if (addDays(event.date, -mixLead) === today) steps.push("mix");
  return steps.filter((step) => !((event.remindersSent || {})[step] === event.date));
};

const STEP_TEXT = {
  poolish: "Start the poolish tonight",
  mix: "Mix dough today",
};

export const doughReminders = onSchedule(
  { schedule: "0 14 * * *", timeZone: TZ, secrets: [GMAIL_APP_PASSWORD], region: "us-central1" },
  async () => {
    const db = getFirestore();
    const settings = (await db.doc("eventSettings/reminders").get()).data() || {};
    const mixLead = mixLeadFrom((await db.doc("planner/ref").get()).data());
    const today = todayLocal();

    const booked = await db.collection("events").where("status", "==", "booked").get();
    const due = booked.docs
      .map((doc) => ({ doc, event: doc.data() }))
      .map((x) => ({ ...x, steps: dueSteps(x.event, today, mixLead) }))
      .filter((x) => x.steps.length);
    if (!due.length) {
      logger.info("No dough reminders today");
      return;
    }

    const blocks = [];
    for (const { event, steps } of due) {
      const weather = await forecastLine(event.geo, event.date).catch(() => "");
      blocks.push(
        [
          `${steps.map((s) => STEP_TEXT[s]).join(" and ")} — ${event.name} (${event.eventType || "event"})`,
          `Event: ${pretty(event.date)}${event.time ? `, ${event.time}` : ""}${event.location ? ` at ${event.location}` : ""}`,
          event.guests ? `Guests: ${event.guests}` : "",
          weather ? `Forecast: ${weather}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      );
    }
    const text = `${blocks.join("\n\n")}\n\nDough amounts: ${SITE}/planner\nEvents: ${SITE}/events\n`;
    const to = (settings.emails && settings.emails.length ? settings.emails : [GMAIL_USER]).join(", ");
    const subject =
      due.length === 1
        ? `Dough: ${due[0].steps.map((s) => STEP_TEXT[s].toLowerCase()).join(" and ")} for ${due[0].event.name}`
        : `Dough reminders: ${due.length} events`;

    await sendMail({ to, subject, text });

    // Remember what was sent so a re-run the same day doesn't email twice.
    await Promise.all(
      due.map(({ doc, event, steps }) =>
        doc.ref.update(Object.fromEntries(steps.map((s) => [`remindersSent.${s}`, event.date])))
      )
    );
    logger.info(`Sent ${due.length} dough reminder(s) to ${to}`);
  }
);
