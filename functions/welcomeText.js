// The welcome email for a /hello sign-up. It mirrors the page they just used:
// the logo, the freebie ticket with the menu photos, then Pizza Friday (next
// dates, directions, add to calendar), then the follow ask. No Firebase
// imports, so it tests on its own (welcome.test.js); signup.js passes in the
// photos and dates.
//
// Email clients ignore page CSS, so everything is inline styles on tables.
// Images are absolute URLs: the logo is public/email-logo.png on the site.

export const WELCOME_DAILY_CAP = 150; // Gmail allows about 500 a day for everything; leave room for quotes and reminders.

const SITE = "https://backyardbrickovenpizza.com";
const LOGO = `${SITE}/email-logo.png`;
const INSTAGRAM = "https://www.instagram.com/backyard_brick_oven/";
const FACEBOOK = "https://www.facebook.com/people/Backyard-Brick-Oven-LLC/100090391791253/";
const DIRECTIONS = "https://g.co/kgs/8o94du5";
// Same feed as the site's add-to-calendar buttons (src/utils/calendarLinks.js).
const FEED = "backyardbrickovenpizza.com/pizza-fridays.ics";
const APPLE_CALENDAR = `webcal://${FEED}`;
const GOOGLE_CALENDAR = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(`webcal://${FEED}`)}`;

const TZ = "America/Denver";
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// "2026-11-14" in Utah time.
export const utahDay = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: TZ });

// "jaron johnson" -> "Jaron"
export const firstName = (name) => {
  const w = String(name || "").trim().split(/\s+/)[0] || "";
  return w ? w[0].toUpperCase() + w.slice(1) : "";
};

// "2026-11-27" -> "Fri, Nov 27"
const fridayLabel = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const signedUpLabel = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: TZ });

const AMBER = "#d97706";
const INK = "#111827";
const MUTED = "#4b5563";

// A white card, like the page's.
const card = (inner, pad = 20) =>
  `<tr><td style="padding:0 0 16px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px"><tr><td style="padding:${pad}px">${inner}</td></tr></table></td></tr>`;

const button = (href, label, style) =>
  `<a href="${href}" style="display:block;text-align:center;padding:14px 18px;border-radius:12px;font-size:17px;font-weight:bold;text-decoration:none;${style}">${label}</a>`;

const treat = (label, src) =>
  `<td width="50%" valign="top" style="padding:4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #fde68a;border-radius:10px"><tr><td style="padding:0">${
    src ? `<img src="${esc(src)}" alt="${esc(label)}" width="220" style="display:block;width:100%;height:auto;border-radius:10px 10px 0 0">` : ""
  }</td></tr><tr><td style="padding:8px;font-weight:bold;font-size:14px;color:${INK};line-height:1.2">${esc(label)}</td></tr></table></td>`;

// extras: { photos: { breadsticks, fzookie } (image URLs), fridays: ["YYYY-MM-DD"], signedUp: Date }
export const welcomeEmail = (name, extras = {}) => {
  const first = firstName(name);
  const photos = extras.photos || {};
  const fridays = (extras.fridays || []).slice(0, 3);
  const signedUp = extras.signedUp || new Date();
  const heading = first ? `You're on the list, ${first}!` : "You're on the list!";
  const ticketLine = `${first ? `For ${first} · ` : ""}Signed up ${signedUpLabel(signedUp)}`;
  const next = fridays.length ? `Next: ${fridays.map(fridayLabel).join(" · ")}` : "";

  const text = `${heading}

FREE Roasted Garlic Breadsticks or a F'Zookie
Show this email at any Pizza Friday. ${ticketLine}

PIZZA FRIDAY
5–7:30 pm in Bountiful${next ? `\n${next}` : ""}
Directions: ${DIRECTIONS}
Add Pizza Fridays to your calendar: ${APPLE_CALENDAR} (iPhone) or ${GOOGLE_CALENDAR} (Google)

ONE MORE THING: FOLLOW US!
Pizza Friday menus, pop-ups and specials go up there first.
Instagram: ${INSTAGRAM}
Facebook: ${FACEBOOK}

Planning a wedding or party? Book us: ${SITE}/inquiries

See you soon,
Jaron, Backyard Brick Oven

You're getting this because you signed up at ${SITE}/hello. Reply "unsubscribe" and we'll take you off the list.
`;

  const ticket = card(
    `<p style="margin:0 0 12px 0;text-align:center;font-weight:bold;color:${INK}">Here's your freebie</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:4px dashed ${AMBER};border-radius:14px;background:#fffbeb"><tr><td style="padding:16px;text-align:center">
<div style="font-size:40px;line-height:1;font-weight:900;color:${INK};letter-spacing:-1px">FREE</div>
<div style="margin:8px 0 12px 0;font-size:17px;font-weight:bold;color:#1f2937">Roasted Garlic Breadsticks or a F'Zookie</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${treat("Roasted Garlic Breadsticks", photos.breadsticks)}${treat("F'Zookie", photos.fzookie)}</tr></table>
<div style="margin-top:10px;font-size:13px;color:${MUTED}">${esc(ticketLine)}</div>
</td></tr></table>
<p style="margin:12px 0 0 0;text-align:center;font-weight:bold;color:${INK}">Show this email at any Pizza Friday.</p>`
  );

  const pizzaFriday = card(
    `<div style="font-size:20px;font-weight:bold;color:${INK}">Pizza Friday</div>
<div style="color:#374151;margin-top:2px">5–7:30 pm in Bountiful</div>
${next ? `<div style="color:#374151;margin-top:4px">${esc(next)}</div>` : ""}
<div style="margin-top:4px"><a href="${DIRECTIONS}" style="color:#b45309;font-weight:bold">Directions</a></div>
<div style="margin:16px 0 8px 0;font-weight:bold;color:${INK}">Add Pizza Fridays to your calendar</div>
${button(APPLE_CALENDAR, "iPhone / Apple Calendar", `background:${INK};color:#ffffff`)}
<div style="height:8px;line-height:8px">&nbsp;</div>
${button(GOOGLE_CALENDAR, "Google Calendar", "background:#ffffff;color:#111827;border:1px solid #e5e7eb")}`
  );

  const follow = card(
    `<div style="font-size:20px;font-weight:bold;color:${INK}">One more thing: follow us!</div>
<p style="margin:4px 0 14px 0;color:#374151">Pizza Friday menus, pop-ups and specials go up there first. It really helps a small business like ours.</p>
${button(INSTAGRAM, "Follow on Instagram", "background:#dd2a7b;background-image:linear-gradient(45deg,#f58529,#dd2a7b 50%,#8134af);color:#ffffff")}
<div style="height:8px;line-height:8px">&nbsp;</div>
${button(FACEBOOK, "Or follow on Facebook", "background:#ffffff;color:#1877f2;border:2px solid #1877f2;font-size:15px;padding:12px 18px")}`
  );

  const html = `<div style="background:#e2e8f0;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:${INK}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto">
<tr><td style="padding:0 0 16px 0;text-align:center"><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;background:#ffffff;border-radius:16px"><tr><td style="padding:14px 18px"><img src="${LOGO}" alt="Backyard Brick Oven" width="190" style="display:block;width:190px;height:auto"></td></tr></table></td></tr>
<tr><td style="padding:0 0 16px 0;font-size:28px;line-height:1.15;font-weight:900;color:${INK}">${esc(heading)}</td></tr>
${ticket}
${pizzaFriday}
${follow}
<tr><td style="padding:4px 4px 0 4px;text-align:center;color:#374151">Planning a wedding or party? <a href="${SITE}/inquiries" style="color:#b45309;font-weight:bold">Book us for your event</a></td></tr>
<tr><td style="padding:16px 4px 0 4px;text-align:center;color:#374151">See you soon,<br>Jaron, Backyard Brick Oven</td></tr>
<tr><td style="padding:16px 4px 0 4px;text-align:center;font-size:12px;color:#6b7280">You're getting this because you signed up at <a href="${SITE}/hello" style="color:#6b7280">backyardbrickovenpizza.com/hello</a>. Reply "unsubscribe" and we'll take you off the list.</td></tr>
</table>
</div>`;

  const subject = first ? `${first}, your free Breadsticks or F'Zookie is here` : "Your free Breadsticks or F'Zookie is here";
  return { subject, text, html };
};
