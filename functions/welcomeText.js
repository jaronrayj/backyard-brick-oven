// The welcome email for a /hello sign-up: the freebie and a nudge to follow.
// No Firebase imports, so it tests on its own (welcome.test.js).

export const WELCOME_DAILY_CAP = 150; // Gmail allows about 500 a day for everything; leave room for quotes and reminders.

const SITE = "https://backyardbrickovenpizza.com";
const INSTAGRAM = "https://www.instagram.com/backyard_brick_oven/";
const FACEBOOK = "https://www.facebook.com/people/Backyard-Brick-Oven-LLC/100090391791253/";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// "2026-11-14" in Utah time.
export const utahDay = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "America/Denver" });

export const welcomeEmail = (name) => {
  const first = String(name || "").trim().split(/\s+/)[0] || "";
  const hi = first ? `Hi ${first},` : "Hi there,";
  const text = `${hi}

Thanks for joining the Backyard Brick Oven list! Show this email at any Pizza Friday for free Roasted Garlic Breadsticks or a F'Zookie.

Pizza Friday: 5–7:30 pm in Bountiful. Menus and dates go up on Instagram and Facebook first:
Instagram: ${INSTAGRAM}
Facebook: ${FACEBOOK}

Planning a wedding or party? ${SITE}/inquiries

See you soon,
Jaron, Backyard Brick Oven

You're getting this because you signed up at ${SITE}/hello. Reply "unsubscribe" and we'll take you off the list.
`;
  const btn = (href, label, bg) =>
    `<a href="${href}" style="display:inline-block;padding:12px 18px;margin:4px 6px 4px 0;border-radius:8px;background:${bg};color:#ffffff;text-decoration:none;font-weight:bold">${label}</a>`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#222222;max-width:520px">
<p>${esc(hi)}</p>
<p>Thanks for joining the Backyard Brick Oven list!</p>
<div style="border:3px dashed #d97706;border-radius:12px;padding:16px;text-align:center;background:#fffbeb;margin:16px 0">
<div style="font-size:28px;font-weight:bold">FREE</div>
<div style="font-weight:bold">Roasted Garlic Breadsticks or a F'Zookie</div>
<div style="font-size:13px;color:#555555;margin-top:6px">Show this email at any Pizza Friday${first ? ` · for ${esc(first)}` : ""}</div>
</div>
<p><strong>Pizza Friday:</strong> 5–7:30 pm in Bountiful. Menus and dates go up on Instagram and Facebook first, so follow along:</p>
<p>${btn(INSTAGRAM, "Follow on Instagram", "#c13584")}${btn(FACEBOOK, "Follow on Facebook", "#1877f2")}</p>
<p>Planning a wedding or party? <a href="${SITE}/inquiries" style="color:#c2410c">Book us for your event</a>.</p>
<p>See you soon,<br>Jaron, Backyard Brick Oven</p>
<p style="font-size:12px;color:#888888">You're getting this because you signed up at backyardbrickovenpizza.com/hello. Reply "unsubscribe" and we'll take you off the list.</p>
</div>`;
  return { subject: "You're on the list! Your free breadsticks or F'Zookie", text, html };
};
