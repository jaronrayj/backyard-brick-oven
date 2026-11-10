// The thank-you + Google review email sent the morning after a booked event.
//
// This file is copied byte for byte to src/pages/Events/reviewAskText.js so the
// Events page previews exactly what goes out (the site and functions build
// separately). functions/reviewAsk.test.js fails if the two copies differ.
// No imports, so it runs in both places.

export const REVIEW_URL = "https://backyardbrickovenpizza.com/review";
export const REVIEW_HOUR = 9; // 9 am, Utah time, the day after the event

// Words that mean the name field holds a business or an event, not a person.
const NOT_A_PERSON = /\b(wedding|reception|party|parties|shower|birthday|reunion|company|corp|corporation|inc|llc|ltd|church|ward|school|team|club|association|event|events|group|family|the)\b/i;

// "Sarah Johnson" -> "Sarah"; "Jess and Austin" / "Jess & Austin" stay whole;
// "Smith wedding", "Acme Corp", "" -> "there" (as in "Hi there").
export const reviewGreetingName = (name) => {
  const n = String(name || "").replace(/\s+/g, " ").trim();
  if (!n || NOT_A_PERSON.test(n) || /\d|@/.test(n)) return "there";
  if (/\s(and|&)\s/i.test(n)) return n;
  return n.split(" ")[0];
};

export const reviewEventWords = (eventType) => (/wedding/i.test(String(eventType || "")) ? "your wedding" : "your event");

// The day after the event date (YYYY-MM-DD).
export const reviewSendDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return "";
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

const emailOf = (event) => {
  const m = /[^\s/<>,;]+@[^\s/<>,;]+\.[^\s/<>,;]+/.exec(String((event && event.email) || ""));
  return m ? m[0] : "";
};

// Where this event stands:
//   "sent"     - already went out (reviewAsk.sentAt)
//   "skipped"  - you chose Don't send
//   "noEmail"  - nothing to send to (you get a "text them" note instead)
//   "waiting"  - booked or done, goes out on reviewSendDate at REVIEW_HOUR
//   "notBooked"- inquiry, quoted or lost: nothing goes out
export const reviewState = (event) => {
  const e = event || {};
  if (e.reviewAsk && e.reviewAsk.sentAt) return "sent";
  if (e.reviewAskSkip) return "skipped";
  if (!["booked", "done"].includes(e.status)) return "notBooked";
  if (!emailOf(e)) return "noEmail";
  return "waiting";
};

export const reviewEmail = (event) => {
  const name = reviewGreetingName(event && event.name);
  const words = reviewEventWords(event && event.eventType);
  const hope = words === "your wedding" ? " and we hope it was everything you wanted" : "";
  const thanks = `Thank you for having Backyard Brick Oven at ${words}! We loved cooking for you and your guests${hope}.`;
  const ask = "If you have 30 seconds, a Google review helps a small business like ours more than you'd think:";
  const text = `Hi ${name},\n\n${thanks}\n\n${ask}\n${REVIEW_URL}\n\n— Jaron\nBackyard Brick Oven\n`;
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#111827;max-width:560px">
<p>Hi ${esc(name)},</p>
<p>${esc(thanks)}</p>
<p>${esc(ask)}</p>
<p><a href="${REVIEW_URL}" style="display:inline-block;background:#d97706;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px">Leave us a review</a></p>
<p style="color:#374151">— Jaron<br>Backyard Brick Oven</p>
<p style="font-size:12px;color:#9ca3af">Or open ${REVIEW_URL.replace("https://", "")}</p>
</div>`;
  return { to: emailOf(event), subject: "Thanks for having us!", text, html };
};
