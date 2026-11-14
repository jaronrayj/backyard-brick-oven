// The automatic reply to a website inquiry: the wording (editable on the
// Events page under Emails, saved in eventSettings/emails.autoReply) and how
// it's filled in.
//
// This file is copied byte for byte to src/pages/Events/replyText.js so the
// Emails page previews exactly what goes out (the site and functions build
// separately). functions/replyText.test.js fails if the two copies differ.
// Its only import is reviewAskText.js, which is copied the same way.
import { reviewGreetingName } from "./reviewAskText.js";

// Placeholders the wording can use.
export const PLACEHOLDERS = [
  ["{name}", "their first name (both names for a couple, \"there\" for a business)"],
  ["{event}", "\"your wedding\", \"your party\", \"your pizza class\" or \"your event\""],
  ["{details}", "the list of what they sent: type, date, time, place, guests, extras, their note"],
];

export const DEFAULT_AUTO_REPLY = {
  on: true,
  subject: "We got your request! 🍕",
  body: [
    "Hi {name},",
    "",
    "Thanks for reaching out about {event}! Here's what you sent us:",
    "",
    "{details}",
    "",
    "I'll put together a written quote and send it within a day or two. If anything above is off, just reply to this email.",
    "",
    "You can see our pricing anytime at backyardbrickovenpizza.com/inquiries.",
    "",
    "Talk soon,",
    "Jaron",
    "Backyard Brick Oven · (801) 872-3439",
  ].join("\n"),
};

export const replyEventWords = (eventType) => {
  const t = String(eventType || "");
  if (/wedding/i.test(t)) return "your wedding";
  if (/class/i.test(t)) return "your pizza class";
  if (/party|shower|bachelorette/i.test(t)) return "your party";
  return "your event";
};

// "2027-01-22" -> "Friday, January 22, 2027"
const fullDate = (iso) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))) return String(iso || "");
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
};

// What they sent, as [label, value] pairs; blank answers are left out.
export const detailRows = (event) => {
  const e = event || {};
  const type = String(e.eventType || "").trim();
  const part = String(e.weddingPart || "").trim();
  const guests = String(e.guestsAsked || e.guests || "").trim();
  const comments = String(e.comments || "").trim();
  return [
    ["Event", type ? `${type}${part ? ` (${part.toLowerCase()})` : ""}` : ""],
    ["Date", fullDate(e.date)],
    ["Service time", String(e.time || "").trim()],
    ["Where", String(e.location || "").trim()],
    ["Guests", guests ? (/^\d+$/.test(guests) ? `about ${guests}` : guests) : ""],
    ["Extras", (e.addOns || []).filter(Boolean).join(", ")],
    ["Your note", comments ? `"${comments}"` : ""],
  ].filter(([, v]) => v);
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const linkify = (html) => html.replace(/\b(backyardbrickovenpizza\.com(?:\/[\w\-/?=&;.#]*[\w/])?)/g, '<a href="https://$1">$1</a>');

// The reply for this inquiry: { subject, text, html }.
export const renderAutoReply = (template, event) => {
  const t = { ...DEFAULT_AUTO_REPLY, ...(template || {}) };
  const rows = detailRows(event);
  const fill = (s) => String(s).replace(/\{name\}/g, reviewGreetingName(event && event.name)).replace(/\{event\}/g, replyEventWords(event && event.eventType));
  const subject = fill(t.subject).replace(/\s+/g, " ").trim();
  const text = fill(t.body)
    .replace(/\{details\}/g, rows.map(([k, v]) => `- ${k}: ${v}`).join("\n"))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const list = `<ul style="padding-left:20px;margin:0 0 16px">${rows.map(([k, v]) => `<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join("")}</ul>`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#111827;max-width:560px">${fill(t.body)
    .trim()
    .split(/\n{2,}/)
    .map((para) => `<p>${linkify(esc(para)).replace(/\n/g, "<br>").replace(/\{details\}/g, `</p>${list}<p>`)}</p>`.replace(/<p>(<br>)*<\/p>/g, ""))
    .join("\n")}</div>`;
  return { subject, text: `${text}\n`, html };
};

// ---------- Quote email (sent from the event editor) ----------
//
// The editor fills these in; {quote} becomes the quote table and {tasting} the
// tasting block (left out when no tasting times are offered). {times} inside
// the tasting block becomes a button per time.

export const QUOTE_PLACEHOLDERS = [
  ["{name}", "their first name"],
  ["{event}", "\"your wedding on Saturday, June 12, 2027\" (just \"your wedding\" with no date)"],
  ["{quote}", "the quote: each line, tax, total and deposit"],
  ["{tasting}", "the tasting block below, only when you offer tasting times"],
];

export const DEFAULT_QUOTE_EMAIL = {
  subject: "Your Backyard Brick Oven quote 🍕",
  body: [
    "Hi {name},",
    "",
    "Here's your quote for {event}:",
    "",
    "{quote}",
    "",
    "{tasting}",
    "",
    "Your date is held once the deposit is paid. Reply to this email when you're ready and I'll send you how to pay.",
    "",
    "Talk soon,",
    "Jaron",
    "Backyard Brick Oven · (801) 872-3439",
  ].join("\n"),
  tasting: [
    "Come try the pizza first! We'd love to have you over for a free tasting. Tap a time that works:",
    "",
    "{times}",
    "",
    "None of those work? Just reply with a couple of times that do.",
  ].join("\n"),
};

// ---------- Tasting emails (sent when they pick a time, and the day before) ----------

export const TASTING_PLACEHOLDERS = [
  ["{name}", "their first name"],
  ["{when}", "\"Tuesday, November 17 at 7:00 pm\""],
  ["{place}", "the tasting address (below)"],
  ["{length}", "\"about an hour\" (from the tasting length below)"],
];

export const DEFAULT_TASTING = {
  place: "",
  minutes: 60,
  confirm: {
    subject: "Your pizza tasting is set! 🍕",
    body: [
      "Hi {name},",
      "",
      "You're all set for a pizza tasting on {when}.",
      "",
      "Where: {place}",
      "It takes {length}.",
      "",
      "If something comes up, just reply to this email and we'll find another time.",
      "",
      "See you soon,",
      "Jaron",
      "Backyard Brick Oven · (801) 872-3439",
    ].join("\n"),
  },
  reminder: {
    subject: "See you tomorrow for your pizza tasting!",
    body: [
      "Hi {name},",
      "",
      "Just a reminder: your pizza tasting is tomorrow, {when}.",
      "",
      "Where: {place}",
      "",
      "If something came up, just reply to this email.",
      "",
      "See you soon,",
      "Jaron",
    ].join("\n"),
  },
};

const TZ = "America/Denver";

// ISO time -> "Tuesday, November 17 at 7:00 pm" (Utah time).
export const tastingWhen = (iso, { short = false } = {}) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = d.toLocaleDateString("en-US", short ? { weekday: "short", month: "short", day: "numeric", timeZone: TZ } : { weekday: "long", month: "long", day: "numeric", timeZone: TZ });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ }).replace(" AM", " am").replace(" PM", " pm");
  return short ? `${day} · ${time}` : `${day} at ${time}`;
};

export const tastingLength = (minutes) => {
  const m = Number(minutes) || 60;
  if (m === 60) return "about an hour";
  if (m % 60 === 0) return `about ${m / 60} hours`;
  if (m > 60) return `about ${Math.floor(m / 60)} hour${m >= 120 ? "s" : ""} ${m % 60} minutes`;
  return `about ${m} minutes`;
};

const paragraphsHtml = (text) =>
  `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#111827;max-width:560px">${text
    .split(/\n{2,}/)
    .map((p) => `<p>${linkify(esc(p)).replace(/\n/g, "<br>")}</p>`)
    .join("\n")}</div>`;

// A tasting email ({ subject, body } template): { subject, text, html }.
export const renderTastingEmail = (template, { name, at, place, minutes }) => {
  const fill = (s) =>
    String(s || "")
      .replace(/\{name\}/g, reviewGreetingName(name))
      .replace(/\{when\}/g, tastingWhen(at))
      .replace(/\{place\}/g, String(place || "").trim() || "(we'll send the address)")
      .replace(/\{length\}/g, tastingLength(minutes));
  const text = fill(template.body).replace(/\n{3,}/g, "\n\n").trim();
  return { subject: fill(template.subject).replace(/\s+/g, " ").trim(), text: `${text}\n`, html: paragraphsHtml(text) };
};
