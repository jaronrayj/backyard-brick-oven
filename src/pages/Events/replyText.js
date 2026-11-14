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
  const body = dropOldSignOff(t.body);
  const text = fill(body)
    .replace(/\{details\}/g, rows.map(([k, v]) => `- ${k}: ${v}`).join("\n"))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const list = `<ul style="padding-left:20px;margin:0 0 16px">${rows.map(([k, v]) => `<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join("")}</ul>`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#111827;max-width:560px">${fill(body)
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
  ["{tasting}", "the tasting invite below: weddings only, and only when you offer tasting times"],
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
  const text = fill(dropOldSignOff(template.body)).replace(/\n{3,}/g, "\n\n").trim();
  return { subject: fill(template.subject).replace(/\s+/g, " ").trim(), text: `${text}\n`, html: paragraphsHtml(text) };
};

// ---------- Signature (every email the app sends) ----------
//
// Your Gmail signature (from the "Email Signature" page), added under every
// email: the automatic reply, quote email, tasting emails and review email.
// Editable under Events > Emails > Signature (eventSettings/emails.signature).
// Turned off, emails end with the short text sign-off instead.

export const DEFAULT_SIGNATURE = {
  on: true,
  html: "<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"color:#222222;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.45;border-collapse:collapse\"><tbody><tr><td style=\"padding-right:14px;vertical-align:top\"><a href=\"https://backyardbrickovenpizza.com/\" target=\"_blank\"><img src=\"https://backyardbrickovenpizza.com/icon-192.png\" width=\"64\" height=\"64\" alt=\"Backyard Brick Oven\" style=\"display:block;border:0;width:64px;height:64px;border-radius:8px\"></a></td><td style=\"border-left:3px solid #c2410c;padding-left:14px;vertical-align:top\"><div style=\"font-size:16px;font-weight:bold;color:#222222\">Jaron Johnson</div><div style=\"color:#555555\">Owner, Backyard Brick Oven</div><div style=\"color:#777777;font-size:13px\">Neapolitan-style pizza for weddings, events &amp; Pizza Fridays · Bountiful, UT</div><div style=\"padding-top:6px\"><a href=\"tel:+18018723439\" style=\"color:#222222;text-decoration:none\" target=\"_blank\">(801) 872-3439</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href=\"https://backyardbrickovenpizza.com/\" style=\"color:#c2410c;text-decoration:none\" target=\"_blank\">backyardbrickovenpizza.com</a></div><div style=\"padding-top:6px;font-size:13px\"><a href=\"https://backyardbrickovenpizza.com/inquiries\" style=\"color:#c2410c;text-decoration:none;font-weight:bold\" target=\"_blank\">Book an event</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href=\"https://backyardbrickovenpizza.com/\" style=\"color:#c2410c;text-decoration:none\" target=\"_blank\">See the menu</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href=\"https://www.instagram.com/backyard_brick_oven/\" style=\"color:#c2410c;text-decoration:none\" target=\"_blank\">Instagram</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href=\"https://share.google/KUHCVmwmo8qqqA64r\" style=\"color:#c2410c;text-decoration:none\" target=\"_blank\">★ Leave us a Google review</a></div></td></tr></tbody></table>",
  text: "Jaron Johnson\nOwner, Backyard Brick Oven\nNeapolitan-style pizza for weddings, events & Pizza Fridays · Bountiful, UT\n(801) 872-3439 · backyardbrickovenpizza.com\nBook an event: https://backyardbrickovenpizza.com/inquiries\nInstagram: https://www.instagram.com/backyard_brick_oven/",
};
const SHORT_SIGN_OFF = "Jaron\nBackyard Brick Oven · (801) 872-3439";

export const signatureFrom = (settings) => ({ ...DEFAULT_SIGNATURE, ...((settings && settings.signature) || {}) });

// Wording saved before the signature existed ends with "Jaron" (and the phone
// line). The signature has both, so drop them rather than say them twice.
export const dropOldSignOff = (body) =>
  String(body || "")
    .replace(/\n+Jaron\s*\n\s*Backyard Brick Oven · \(801\) 872-3439\s*$/, "")
    .replace(/\n+Jaron\s*$/, "");

// { subject, text, html } + the signature -> the same, signed.
export const appendSignature = (mail, signature = DEFAULT_SIGNATURE) => {
  const sig = { ...DEFAULT_SIGNATURE, ...(signature || {}) };
  const on = sig.on !== false && String(sig.html || "").trim();
  const text = on ? String(sig.text || "").trim() : SHORT_SIGN_OFF;
  const html = on
    ? `<div style="margin-top:20px">${sig.html}</div>`
    : `<p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#111827">${esc(SHORT_SIGN_OFF).replace(/\n/g, "<br>")}</p>`;
  return {
    ...mail,
    text: `${String(mail.text || "").replace(/\s+$/, "")}\n\n${text}\n`,
    html: mail.html ? `${mail.html}\n${html}` : mail.html,
  };
};
