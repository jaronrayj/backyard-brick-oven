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
| Dough reminder recipients | Firestore `eventSettings/reminders`, edited under "Pricing" |
| Website inquiries → events | `functions/events.js` `saveInquiryEvent`, called by `sendInquiry` (status "inquiry") |
| Dough reminder emails | `functions/events.js` `doughReminders`, daily at 2 pm Utah time |
| Weather | [Open-Meteo](https://open-meteo.com/) (free, no key). The location is turned into a point when an event is saved; street addresses fall back to the town. |

Statuses: Inquiry → Quoted → Booked → Done, or Lost. Saving an inquiry with a
new quote moves it to Quoted.

## Quotes

"Build quote from pricing" picks a package (the first whose "matches" word is
in the event type, else the last one), charges extra guests over the package,
adds per-person add-ons, and travel past the free miles. Every line stays
editable. "Copy as text" is for email or text messages; "Print / PDF" opens a
clean page to print or save as PDF.

The starting prices are only placeholders: Wedding and Party at $1,500 for up
to 100 guests, $15 per extra guest, salad $3 and pasta $5 per person; dessert,
charcuterie, travel, tax and deposit are 0 until you set them.

## Dough reminders

For events marked **Booked**: one email on poolish day and one on mix day
(timing below), with the forecast and a link to the planner. Add Pizza Fridays as booked events to get reminders for those too.

## Wrap-up

`/events/wrapup` (the "Wrap up" button on Events) replaces the money tracker
Google Form. It lists the last three weeks from the tracker and from Google
Calendar: calendar entries on the same date as a tracker event are shown with
it, and the calendar's event notes appear above the form with "Add to notes".
Pick one (or "Prep day" / "Something else"), fill in the numbers and hours,
and it writes the next empty row of the money tracker's "Form Responses" tab,
the same columns the form filled. The fields follow that tab's header row, so
a new "Name hours" column shows up as a new field. A tracker event that is
wrapped up is marked Done.

It writes the first empty row by column A rather than appending, because the
year formula in the last column runs far below the data and an append would
land under it. That formula column is never written.

The calendar read is `jj.backyardbrickoven@gmail.com` unless
`eventSettings/wrapUp` has a `calendarId`.

## Phone notifications

"🔕 Notifications" at the top of `/events` turns notifications on for that
phone (install the site as an app first; on iPhone, add it to the Home Screen
and open it from there). Code: `functions/push.js`, the page button
`src/pages/Events/Notifications.js`, and `public/firebase-messaging-sw.js`.

| Notification | When |
| --- | --- |
| New inquiry | As soon as the website form is sent |
| Dough step (poolish tonight / mix today) | 2 pm, with the reminder email, for booked events |
| Morning summary | 7 am: today's Google Calendar entries, dough steps and booked events; skipped when there's nothing |

Only the emails in Firestore `eventSettings/notifications` (`emails: [...]`)
can turn them on; with no list it's `jj.backyardbrickoven@gmail.com` alone.
Each phone's push token is kept in `pushTokens/` (server only). The morning
summary reads the same calendar as Wrap-up, so it needs the same sharing.

## Dough reminder timing

Mix day is the dough planner's "mix days before service" setting (Dough
calculator sheet), and poolish goes in the evening before, the same as the
planner's Dough tab. Pricing only sets who gets the emails.

## One-time setup

1. **Deploys.** Functions and the rules in `firestore.rules`,
   `database.rules.json` and `storage.rules` deploy on merge
   ([team.md](team.md)).
2. **Wrap-up access.** Open `/events/wrapup` as an admin; it lists anything
   still missing, with the service account email to use:
   - Share the money tracker sheet with that email as **Editor**.
   - In Google Calendar, share the business calendar with that email:
     "See all event details".
   - Turn on the Google Calendar API for the project if the page says it's off.
   Then turn off "Accepting responses" on the money tracker Google Form.
3. **Set your prices.** Open `/events` → Pricing: tax rate, deposit, add-on
   prices, and who gets the dough reminder emails.

Hosting deploys on merge to `main` as before.
