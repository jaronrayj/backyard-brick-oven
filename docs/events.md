# Events and quotes

`/events` tracks events from first inquiry to done, builds quotes from your
pricing, shows the forecast once an event is within 16 days, and emails dough
reminders for booked events. Admins only ([team.md](team.md)).

## How it fits together

| Piece | Where |
| --- | --- |
| Page | `src/pages/Events/` (`index.js` page, `quote.js` quote math, `schedule.js` dough dates and weather) |
| Events | Firestore `events/{id}` |
| Pricing (packages, add-ons, travel, tax, deposit, quote note) | Firestore `eventSettings/pricing`, edited under "Pricing" |
| Prices on the public website (packages, add-on range, travel zones) | Firestore `publicSettings/site`, copied from Pricing on every save (anyone can read it) |
| Next Pizza Fridays on the home page | `functions/planner.js` `upcomingPizzaFridays` (public; dates of "Pizza Friday" calendar entries only) |
| Website visitor counts (Events → Report) | Firestore `siteStats/{YYYY-MM}`, one number per step, added by `functions/stats.js` `countStep`; the page side is `src/utils/track.js` |
| Dough reminder recipients | Firestore `eventSettings/reminders`, edited from the bell → Notification times |
| Website inquiries → events | `functions/events.js` `saveInquiryEvent`, called by `sendInquiry` (status "inquiry") |
| Dough reminder emails | `functions/events.js` `runDoughReminders`, run every 15 minutes by `notificationTimer` (which also runs the morning summary), and sends at the time set from the bell → Notification times (default 2 pm Utah time) |
| Weather | [Open-Meteo](https://open-meteo.com/) (free, no key). The location is turned into a point when an event is saved; street addresses fall back to the town. |

Stages: Inquiry → Quoted → Booked → Done, or Lost. The list has two tabs:
**Open** (grouped into New inquiries, Quoted and Booked) and **Done & lost**.
Move an event with the Stage buttons at the top of its page; on a saved event
they save as soon as you tap. Saving an inquiry with a new quote moves it to
Quoted, and a wrap-up moves a booked event to Done.

Wedding inquiries also ask **which part of the wedding**: Reception,
Luncheon or dinner, Both, or Not sure yet (`weddingPart` on the event, and
"Wedding Part" in the inquiry email). The event shows a rough pizza count from
the planner's per-guest settings: a reception uses "pizzas per guest wedding",
and a luncheon, dinner or both uses "pizzas per guest pizza only". To price them
differently, add a package whose "matches" word is `reception` or `dinner`
above the Wedding package.

## Quotes

"Build quote from pricing" picks a package (the first whose "matches" word is
in the event type, else the last one), charges extra guests over the package,
adds per-person add-ons, and a travel fee by zone (one-way miles from Bountiful; past the last zone it
warns you to add travel by hand). Every line stays
editable. "Copy as text" is for email or text messages; "Print / PDF" opens a
clean page to print or save as PDF.

The starting prices are only placeholders: Wedding $1,500 for up to 100
guests, Party $15 a guest with a 25-guest minimum (a $375 package for 25,
then $15 each), $15 per extra guest, salad $3 and pasta salad $5 per person,
travel by zone; dessert, charcuterie, tax and deposit are 0 until you set
them. The website shows Parties as "$X per guest" and "N-guest minimum",
from the Party package's extra-guest price and included guests.

## Dough reminders

For the Planner's services (`planner/plan`), and for events marked **Booked** that
aren't already a Planner service on the same date: one email on poolish day and one on mix day
(timing below), with the forecast and a link to the planner. Pizza Fridays on the Planner get them without being added as events.

## Wrap-up

The Planner's **Wrap up** tab (`/planner#wrapup`, admins) replaces the money tracker
Google Form. It lists the last week from the tracker and from Google
Calendar: calendar entries on the same date as a tracker event are shown with
it, and the calendar's event notes appear above the form with "Add to notes".
Pick one (or "Prep day" / "Something else"), fill in the numbers and hours,
and it writes the next empty row of the money tracker's "Form Responses" tab,
the same columns the form filled. The fields follow that tab's header row, so
a new "Name hours" column shows up as a new field. A tracker event that is
wrapped up is marked Done; a calendar-only entry is remembered in Firestore `wrapUps/{calendar id}` (server only), so both show "Wrapped up" and stop the reminder. **Skip** (next to each entry) closes one out without a wrap-up: `wrapUpSkipped` on the event, or `wrapUps/{calendar id}` with `skipped: true`; it drops off the list and its reminders stop. A wrap-up started from "Prep day" or "Something else" also closes the calendar entries on that date whose title matches its name (a "Prep" wrap-up closes the day's prep entry).

From the Planner's Wrap up tab, **Dough made** starts filled from the Planner
(`plannerWrapInfo` in `planner.js`): a "Prep" wrap-up gets everything mixed on that
day; an event gets its services on that date (by name when there are several), the
whole mix when it had the mix to itself, else its share. Bread is left out. Once
sold (and comped) are in, the form shows the dough left over. Clearing finished
services on the Planner first means there's nothing to fill from.

It writes the first empty row by column A rather than appending, because the
year formula in the last column runs far below the data and an append would
land under it. That formula column is never written.

**Editing.** There's one list: tap an entry marked "Wrapped up" to open its saved row
(wrap-ups whose event date is in the last 3 days, `EDIT_DAYS` in
`functions/wrapupRows.js`), read fresh
from the sheet. When the entry's name matches none or several of that date's rows,
it asks which one, with a button for each. A "Something else" wrap-up with no
calendar entry isn't in the list, so change it in the Form Responses tab. Saving updates that row
in place and never adds one. The server first re-reads the row and refuses if
its timestamp, date or event name changed, or if the event is now too old, and
writes only the cells whose value changed, so a sum typed into a cell
(`=482.14+50`) stays unless its number changes. Older wrap-ups are changed
directly in the Form Responses tab, not on the monthly or yearly tabs, which
are formulas. The copy saved on the event (`wrapUp.values`) isn't updated by an
edit; only its presence is read, to mark the event as wrapped up.

The calendar read is the "pizza events" calendar (owned by
`jj.backyardbrickoven@gmail.com`; ID in `functions/wrapup.js`) unless
`eventSettings/wrapUp` has a `calendarId`.

## Phone notifications

"🔕 Notifications" at the top of `/events` turns notifications on for that
phone (install the site as an app first; on iPhone, add it to the Home Screen
and open it from there). Code: `functions/push.js`, the bell in the team bar
`src/components/Notifications/`, and `public/firebase-messaging-sw.js`.

| Notification | When |
| --- | --- |
| New inquiry | As soon as the website form is sent |
| Dough step (poolish tonight / mix today) | The dough reminder time (default 2 pm), with the email, for Planner services and booked events |
| Morning summary | The morning time (default 7 am): today's Google Calendar entries, dough steps and booked events, plus yesterday's events still to wrap up; skipped when there's nothing |
| Wrap-up reminder | At each event's Google Calendar end time (within 15 minutes) (all-day entries and events without a time: the wrap-up time, default 9 pm), once per event and only if it has no wrap-up yet; tapping it opens the Planner's **Wrap up** tab (admins; `/planner#wrapup`), the only place wrap-ups are done (`/events/wrapup` redirects there; the page code is `src/pages/Events/WrapUp.js`). The tab shows how many of the last week's ended events still need one (`wrapUpsDue`). Sent ones are kept in `wrapUpReminders/{date}`. The next morning's summary lists anything from yesterday still not wrapped up |

Tapping a notification opens the spot it's about (paths in
`functions/links.js`): a new inquiry or review reminder opens that event on
Events (`/events?event=<id>`), a wrap-up reminder opens that event's wrap-up
form (`/planner?key=<key>#wrapup`; the Wrap up tab when there are several), a
dough step opens the Planner's Prep tab, and the morning summary its Calendar
tab. If the site is already open, the service worker brings it forward and
the page goes there (`src/pages/App`), instead of staying where it was.

Every notification is also kept in Firestore `notifications/` for 30 days
(written by `sendPush`; admins can read it). The bell's **Recent
notifications** lists them on any device, even one with notifications off;
tap one to go where it points.

To check a device, tap the bell once notifications are on and choose **Send a
test** (`testPush`). It sends only to that device and shows any error FCM
returns.

Only the emails in Firestore `eventSettings/notifications` (`emails: [...]`)
can turn them on; with no list it's `jj.backyardbrickoven@gmail.com` alone.
Each phone's push token is kept in `pushTokens/` (server only). The morning
summary reads the same calendar as Wrap-up, so it needs the same sharing.

Planner services sharing a mix day get one reminder, using the Planner's own
"mix days before" tweak when set (else the sheet's). What was sent is kept in
`eventSettings/plannerReminders` (`sent: {"poolish|<mix day>": date}`); the push
goes out even if the email fails. Logic and tests: `functions/plannerReminders.js`.

## Dough reminder timing

Mix day is the dough planner's "mix days before service" setting (Dough
calculator sheet), and poolish goes in the evening before, the same as the
planner's Dough tab. The bell → Notification times sets when they go out and who gets the emails.

## One-time setup

1. **Deploys.** Functions and the rules in `firestore.rules`,
   `database.rules.json` and `storage.rules` deploy on merge
   ([team.md](team.md)).
2. **Wrap-up access.** Open the Planner's Wrap up tab as an admin; it lists anything
   still missing, with the service account email to use:
   - Share the money tracker sheet with that email as **Editor**.
   - In Google Calendar, share the "pizza events" calendar with that email:
     **"Make changes to events"** (the calendar sync below writes entries;
     reading alone needs only "See all event details").
   - Turn on the Google Calendar API for the project if the page says it's off.
   Then turn off "Accepting responses" on the money tracker Google Form.
3. **Set your prices.** Open `/events` → Pricing: tax rate, deposit, add-on
   prices, and who gets the dough reminder emails.

Hosting deploys on merge to `main` as before.

## Report

Events → Report has two tables for the last six months.

- **Website visitors:** visited the site → opened the inquiries page → scrolled
  to pricing → opened the quote form → started filling it in → sent it, plus
  how many closed the form after starting it and how many hit an error. Each
  step counts once per visit, so refreshing doesn't inflate it. A browser that
  is signed in, has been on a team page, or has opened the site once with
  `?notrack` in the address is left out, in Google Analytics too
  (`localStorage` `bybo-team`). Nothing is counted until sign-in is known.
  Once about 20 people a month open the inquiries page, the report points out
  the step where most of them stop.
- **Inquiries and events:** added each month (website inquiries are marked
  `source: "website"`), and how many of those have since been quoted, booked
  or lost.

The same steps also go to Google Analytics (property in `src/utils/firebase.js`),
which adds where visitors came from and what device they used. Nothing personal
is sent: no names, emails or form answers.

## Follow-up and history

Each event keeps a `history` list (`[{ at, type, text }]`, `at` in milliseconds) that the editor shows as a timeline. Lines are added on their own when you:

- create an event, write or change a quote, or change the date or guest count (on Save)
- tap a stage button
- tap Email follow-up or Text follow-up, one of the quick buttons (Sent the quote, They replied, Talked or texted), or add your own line

Events from before this change show one "Added" line from `createdAt`.

"Last contact" is the newest created, quote-sent, contact or follow-up line. Inquiries are flagged for follow-up after 2 quiet days and quotes after 5 (`FOLLOW_UP_DAYS` in `src/pages/Events/history.js`); the list shows "Follow up: last contact N days ago" on those rows. The follow-up message is written from the stage and what's missing (date, guests, location) and opens in your mail or messages app.

## Poster page (/hello)

`/hello` is the landing page for the QR code on event posters
(`src/pages/Hello`). The freebie needs no sign-up; the email list is optional:

- Free Roasted Garlic Breadsticks or a F'Zookie for showing the screen at any
  Pizza Friday (on trust, no code). Names and photos come from the menu
  (Realtime Database `pizzas`), so a new menu photo shows up there too.
- **Follow us!** Instagram and Facebook buttons in their brand colors, right
  under the freebie.
- **Email list:** email (required) and first name (optional), sent to
  `/api/signup` (`functions/signup.js`, rules shared with the page in
  `signupText.js`, copied byte for byte to `src/pages/Hello/`). Saved to
  Firestore `signups/{id}` (id from the email, so signing up twice keeps the
  first). Only the function writes; admins read the list at
  **/admin/signups** (Email list on the team home, not a tab) with a CSV
  download. No email per sign-up, since a busy event could bring dozens.
- The next Pizza Fridays (`upcomingPizzaFridays`), hours and directions.
- Add Pizza Fridays to your calendar (also the home page's "Pizza Friday
  calendar" button): subscribes to the site's own feed,
  `backyardbrickovenpizza.com/pizza-fridays.ics` (`functions/pizzaFridayFeed.js`,
  `src/utils/calendarLinks.js`). Apple through `webcal://`, Google by URL.
- Book us for your event (`/inquiries`).

The Report shows `hello_view` (opened `/hello`), `hello_follow` (tapped Follow),
`hello_signup` (joined the email list) and `hello_calendar` (tapped an
add-to-calendar button).

## Pizza Fridays feed

`/pizza-fridays.ics` is built from the pizza events calendar, the same one the
Planner and the home page dates use. Every entry titled "Pizza Friday"
counts, unless its title says "cancel". It covers 2 weeks back and 4 months
ahead. Each date gets the same public title, hours (5–7:30 pm, `HOURS`),
place and site link. The entry's own times (setup), notes and location are
never sent. To skip a Friday, delete it or put "cancelled" in its title.

How fast changes show up:
- the home page and /hello dates: within a minute (`upcomingPizzaFridays` cache)
- the feed itself: within 5 minutes (Hosting CDN cache)
- subscribers' phones: whenever their calendar app refreshes. Apple is usually
  every few hours (the feed asks for 6), and Google Calendar can take up to a day.
  Nothing on our side can speed that up.

If the calendar can't be read, the feed answers 503 rather than an empty
calendar, so subscribers' apps keep the Fridays they already have.

The old public "Pizza Fridays" Google Calendar is no longer used.

## Automatic reply to inquiries

A minute after a website inquiry with an email address comes in,
`functions/autoReply.js` (called from `sendInquiry`) emails them from the
business Gmail, with Reply-To set to that Gmail. The email thanks them, lists
what they sent (type, date, service time, place, guests, extras, their note,
leaving out anything blank) and says the quote is coming within a day or two.
The event's history gets "Automatic reply sent to …". If the reply fails, the
inquiry still goes through. Inquiries with only a phone number get nothing.

The wording is edited under **Events → Emails**: on/off, subject and message,
with a live preview for a wedding and a party. `{name}` (same greeting as the
review email), `{event}` ("your wedding" / "your party" / "your pizza class" /
"your event") and `{details}` (the list) fill in for each inquiry. It's saved
in `eventSettings/emails.autoReply`; with nothing saved, the defaults in
`replyText.js` are used. `functions/replyText.js` is copied byte for byte to
`src/pages/Events/replyText.js` for the preview, and a test checks they match.

## Events on the calendar

`functions/calendarSync.js` (`syncEventCalendar`, runs on every save of
`events/{id}`) keeps one entry per event on the pizza events calendar:

| Event | Calendar entry |
| --- | --- |
| Quoted, with a date | "(Tentative) Name – Type, N guests", gray, status tentative |
| Booked or Done | the same entry, confirmed, normal color |
| Inquiry, Lost, no date, or deleted in the app | removed |

The entry follows changes to the date, time, place, guests and type.

It blocks out the whole day: from leaving home to the end of cleanup. The title
ends with the service time ("· service 5–8 pm"), and the description lists the
day:

- Leave by 3:20 pm (40 min drive, 30 mi)
- Set up from 4:00 pm
- SERVICE 5:00 pm–8:00 pm
- Pack up until 8:30 pm
- Home about 9:10 pm, clean up until 9:40 pm

**Service time.** The time field is free text. "5-8 pm", "11-2pm" (11 am to
2 pm), "12:30 pm to 3" and "7-10" (pm) are read as a range. A single time
("6 pm", "around 6", read as pm) gets the default service length. Anything
else ("Evening") makes an all-day entry that asks for a time.

**Drive.** The event's one-way miles at the average speed, rounded up to 5
minutes, never under 10. With no miles, it uses the straight-line distance from
Bountiful to the event's town × 1.25. With neither, it guesses 30 minutes and
says so.

**Settings.** Set-up (60), pack-up (30), cleanup (30), service length when only
a start is given (150) and average speed (45 mph) are under **Events → Pricing →
Event day**, saved as `eventSettings/pricing.eventDay` and never published.
Saving new times, or **Update calendar entries now**, redoes the upcoming
entries.

The description also has the type, guests, add-ons, name and phone, and a link
to the event.

- **Ids.** Each entry's Google id is `ev` + the event id in hex, so quick saves
  never make two entries.
- **Entries you already made.** If that day already has an entry with the
  customer's first name in its title, it's linked (`calendar.manual`) instead
  of adding another, and the app leaves it alone. **Let the app manage it** in
  the event (`calendar.adopt`) takes that same entry over: it gets the app's
  title, times and description and stays in step from then on
  (`calendar.adopted`, keeping your entry's id).
- **Deleted in Google Calendar** means "keep it off": the app leaves it off
  (`calendar.optOut`) until **Put it back on my calendar** in the event.
- **The event editor's Calendar line** shows where the event stands. **Add it
  now** syncs an event saved before this existed. Save never writes
  `calendar`; only the sync and those buttons (`calendar.revive`) do.
- **No loops.** Saves that change nothing but `calendar` don't sync again, so
  a failing sync records `calendar.error` once and stops. The next real save,
  or **Try again**, retries.
- **Tentative entries** stay off the Planner's "From your calendar", wrap-up,
  the morning summary and the Pizza Fridays feed (`readCalendar` in
  `wrapup.js`). The Planner's Calendar tab shows them. The morning summary
  also skips entries the app made for booked events, since it already lists
  them as "Event today".

## Quote email and tastings

**Email the quote** (event editor, under the quote) sends the quote from the
business Gmail to the event's email address. The message starts from the
wording under **Events → Emails** and can be changed for each email. `{quote}`
becomes the quote table (lines, tax, total, deposit as an amount, the quote's
bottom note). `{tasting}` becomes the tasting invite, but only when tasting
times are added, with a button per time. It's built in the browser
(`src/pages/Events/quoteEmailText.js`, previewed exactly as sent) and sent by
`sendQuoteEmail` (`functions/tasting.js`, admins only). That moves an Inquiry
to Quoted, adds "Quote emailed to …" (and the offered times) to the history,
and sets `quoteEmailedAt`. The button waits until the event is saved, has a
quote and has an email address. The editor closes after sending.

**Tastings.** Offering times makes `tastings/{token}` (server only). Each
button links to `/tasting?t=<token>&i=<n>` (`src/pages/Tasting`), where they
confirm a time (`tastingInfo` / `pickTasting`). Past times can't be picked,
and the first pick wins. A pick:
- saves `tasting.picked` on the event, with a history line
- emails them the confirmation with the tasting address
- sends you a notification
- adds "Tasting: <name>" to the pizza events calendar (needs "Make changes to
  events" sharing)

At 9 am the day before, they get a reminder (`runTastingReminders` in
`notificationTimer`). The address, length (default 60 minutes), confirmation
and reminder are under Events → Emails (`eventSettings/emails.tasting`). The
address appears only in those two emails.

Tasting entries carry `byboTasting`. Wrap-up, the Planner's "From your
calendar" and the Pizza Fridays feed skip them; the morning summary and the
Planner's Calendar tab show them.

## Signature

Every email the app sends ends with your email signature: the automatic
reply, the quote email, both tasting emails and the review email. It's the
same one as in Gmail (logo, name, title, phone, website and links), from the
"Email Signature" page. The wording above it ends with just "Talk soon," /
"See you soon," / "Thanks again,", since the signature carries your name and
phone. `appendSignature` in `replyText.js` adds it. The server adds it for the
auto-reply, tasting emails and review email; the event editor adds it to the
quote email so the preview is exact.

It's edited under **Events → Emails → Signature** (on/off, the plain-text
version, and the HTML under "advanced"), saved as
`eventSettings/emails.signature`. Turned off, emails end with "Jaron /
Backyard Brick Oven · (801) 872-3439". Wording saved before the signature
existed loses its old "Jaron" sign-off lines (`dropOldSignOff`), so they aren't
there twice.

The Emails screen shows one email at a time (tabs: Auto-reply, Quote, Tasting
confirmation, Tasting reminder, Signature). **Save** keeps all of them.
