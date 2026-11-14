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
