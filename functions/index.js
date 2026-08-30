import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import logger from "firebase-functions/logger";
import nodemailer from "nodemailer";

// Gmail App Password, stored in Google Secret Manager (not in code).
// Set with: firebase functions:secrets:set GMAIL_APP_PASSWORD
const GMAIL_APP_PASSWORD = defineSecret("GMAIL_APP_PASSWORD");

// The Gmail account used to send AND receive the notification.
const GMAIL_USER = "jj.backyardbrickoven@gmail.com";
const NOTIFY_TO = "jj.backyardbrickoven@gmail.com";

// Fields we accept from the form. Keep in sync with the Inquiries form inputs.
const FIELDS = [
  ["name", "Name", true],
  ["event_type", "Type of Event", true],
  ["event_for", "Who's It For", true],
  ["event_date", "Event Date", true],
  ["event_location", "Event Location", true],
  ["rough_event_time", "Service Time", false],
  ["estimated_guests", "Estimated Guests", true],
  ["contact", "Email or Phone", true],
  ["heard_about", "Heard About Us", false],
  ["comments", "Comments", false],
];

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Parse a "YYYY-MM-DD" value (from the <input type="date">) into a Date at
// local noon, avoiding timezone-shift-to-previous-day issues.
const parseEventDate = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), 12, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

// "Tuesday, September 15, 2026"
const formatFullDate = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// Compact "YYYYMMDD" used by Google Calendar all-day event links.
const toGCalDate = (date) => {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${mo}${d}`;
};

// Build a Google Calendar "create event" URL as an all-day event on the given
// date. End date must be the day after start for all-day events.
const buildGCalUrl = (date, title, details, location) => {
  const start = toGCalDate(date);
  const end = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${toGCalDate(end)}`,
    details,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const sendInquiry = onRequest(
  { secrets: [GMAIL_APP_PASSWORD], cors: true, region: "us-central1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.set("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = req.body || {};

    // Honeypot: bots fill hidden fields. If present, pretend success and drop it.
    if (body._gotcha) {
      logger.info("Honeypot triggered — dropping submission");
      return res.status(200).json({ ok: true });
    }

    // Validate required fields.
    const missing = FIELDS.filter(
      ([key, , required]) => required && !String(body[key] || "").trim()
    ).map(([, label]) => label);

    if (missing.length > 0) {
      return res
        .status(400)
        .json({ error: `Missing required field(s): ${missing.join(", ")}` });
    }

    // Parse the event date once for weekday formatting + calendar link.
    const eventDate = parseEventDate(body.event_date);
    const prettyDate = eventDate
      ? formatFullDate(eventDate)
      : String(body.event_date || "").trim();

    // Build readable email content from whatever fields are present.
    // The Event Date row shows the formatted weekday version when parseable.
    const rows = FIELDS.filter(([key]) => String(body[key] || "").trim()).map(
      ([key, label]) => ({
        label,
        value:
          key === "event_date"
            ? prettyDate
            : String(body[key]).trim(),
      })
    );

    const textBody = rows.map((r) => `${r.label}: ${r.value}`).join("\n");

    // Build an "Add to Google Calendar" link (all-day event on the event date).
    let calendarButtonHtml = "";
    let calendarTextLine = "";
    if (eventDate) {
      const title = `Backyard Brick Oven — ${String(
        body.event_type || "Event"
      ).trim()} for ${String(body.name || "").trim()}`;
      const detailLines = rows
        .map((r) => `${r.label}: ${r.value}`)
        .join("\n");
      const gcalUrl = buildGCalUrl(
        eventDate,
        title,
        detailLines,
        String(body.event_location || "").trim()
      );
      calendarButtonHtml = `
        <p style="margin-top:20px">
          <a href="${escapeHtml(gcalUrl)}"
             style="display:inline-block;background:#d97706;color:#ffffff;
                    text-decoration:none;font-weight:bold;font-family:sans-serif;
                    padding:12px 20px;border-radius:8px">
            📅 Add to Google Calendar
          </a>
        </p>`;
      calendarTextLine = `\nAdd to Google Calendar: ${gcalUrl}\n`;
    }

    const htmlBody = `
      <h2>New Catering Inquiry</h2>
      <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif">
        ${rows
          .map(
            (r) =>
              `<tr><td style="font-weight:bold;vertical-align:top">${escapeHtml(
                r.label
              )}</td><td>${escapeHtml(r.value)}</td></tr>`
          )
          .join("")}
      </table>
      ${calendarButtonHtml}
    `;

    const fullText = `${textBody}\n${calendarTextLine}`;

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASSWORD.value(),
        },
      });

      await transporter.sendMail({
        from: `"Backyard Brick Oven" <${GMAIL_USER}>`,
        to: NOTIFY_TO,
        replyTo: String(body.contact).trim(),
        subject: `New inquiry: ${String(body.event_type).trim()} — ${String(
          body.name
        ).trim()}`,
        text: fullText,
        html: htmlBody,
      });

      logger.info("Inquiry email sent");
      return res.status(200).json({ ok: true });
    } catch (err) {
      logger.error("Failed to send inquiry email", err);
      return res
        .status(500)
        .json({ error: "Failed to send. Please try again or text us." });
    }
  }
);
