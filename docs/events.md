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

For events marked **Booked**: one email on poolish day and one on mix day
(timing below), with the forecast and a link to the planner. Add Pizza Fridays as booked events to get reminders for those too.

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

It writes the first empty row by column A rather than appending, because the
year formula in the last column runs far below the data and an append would
land under it. That formula column is never written.

**Editing.** Wrap-ups whose event date is in the last 3 days (`EDIT_DAYS` in
`functions/wrapupRows.js`) are listed under "Edit a recent wrap-up", read fresh
from the sheet; a "Wrapped up" entry opens its row too. Saving updates that row
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
and open it from there). Code: `functions/push.js`, the page button
`src/pages/Events/Notifications.js`, and `public/firebase-messaging-sw.js`.

| Notification | When |
| --- | --- |
| New inquiry | As soon as the website form is sent |
| Dough step (poolish tonight / mix today) | The dough reminder time (default 2 pm), with the email, for booked events |
| Morning summary | The morning time (default 7 am): today's Google Calendar entries, dough steps and booked events, plus yesterday's events still to wrap up; skipped when there's nothing |
| Wrap-up reminder | At each event's Google Calendar end time (within 15 minutes) (all-day entries and events without a time: the wrap-up time, default 9 pm), once per event and only if it has no wrap-up yet; tapping it opens the Planner's **Wrap up** tab (admins; `/planner#wrapup`), the only place wrap-ups are done (`/events/wrapup` redirects there; the page code is `src/pages/Events/WrapUp.js`). The tab shows how many of the last week's ended events still need one (`wrapUpsDue`). Sent ones are kept in `wrapUpReminders/{date}`. The next morning's summary lists anything from yesterday still not wrapped up |

To check a device, tap the bell once notifications are on and choose **Send a
test** (`testPush`). It sends only to that device and shows any error FCM
returns.

Only the emails in Firestore `eventSettings/notifications` (`emails: [...]`)
can turn them on; with no list it's `jj.backyardbrickoven@gmail.com` alone.
Each phone's push token is kept in `pushTokens/` (server only). The morning
summary reads the same calendar as Wrap-up, so it needs the same sharing.

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
     "See all event details".
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

## Signups (poster QR code)

`/hello` is the landing page for the QR code on event posters: follow on
Instagram or Facebook (direct profile links), join the
list for free Roasted Garlic Breadsticks or a F'Zookie, or book us (`/inquiries`). Code: `src/pages/Hello`.

The form takes a first name and a phone number or email. When it's a phone
number, the texts consent checkbox appears and must be checked. The
`sendSignup` function (`functions/signup.js`, reached at `/api/signup`) checks
it and saves `signups/{id}`:

- `name`, `contact` (`+18015551234` or a lowercased email), `contactType` (`phone` | `email`)
- `consent` (agreed to texts; always false for email) and `consentText`, the exact words they agreed to
- `source` (`hello`), `code` (like `BYBO-K7QM`), `createdAt`

The id comes from the contact, so signing up again gives back the same code
instead of a second one. Each new sign-up also sends a short email to the
business inbox. A failed email doesn't stop the sign-up.

The consent wording and the phone/email rules are in `functions/signupText.js`,
copied byte for byte to `src/pages/Hello/signupText.js`. The functions tests
fail if the two copies differ.

Admins see the list under Events > Signups (newest first, with Download CSV).
The Firestore rules let admins read `signups` and stop anyone writing it from
the browser. Only the function writes it.

The Report shows two counts for the page: `hello_view` (opened `/hello`) and
`hello_signup` (signed up).
