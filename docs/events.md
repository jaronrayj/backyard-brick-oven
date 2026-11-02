# Events and quotes

`/events` tracks events from first inquiry to done, builds quotes from your
pricing, shows the forecast once an event is within 16 days, and emails dough
reminders for booked events. Admins only (the `admins` list in
`plannerAccess/team`, same as the business dashboard).

## How it fits together

| Piece | Where |
| --- | --- |
| Page | `src/pages/Events/` (`index.js` page, `quote.js` quote math, `schedule.js` dough dates and weather) |
| Events | Firestore `events/{id}` |
| Pricing (packages, add-ons, travel, tax, deposit, quote note) | Firestore `eventSettings/pricing`, edited under "Pricing" |
| Dough reminder timing and recipients | Firestore `eventSettings/reminders`, edited under "Pricing" |
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

For events marked **Booked**: one email on poolish day (default 2 days before)
and one on mix day (default 1 day before), with the forecast and a link to the
planner. Add Pizza Fridays as booked events to get reminders for those too.

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

## One-time setup

1. **Firestore rules.** Add inside `match /databases/{database}/documents`,
   next to the planner rules:

   ```
   function eventAdmin() {
     return request.auth != null
       && request.auth.token.email_verified == true
       && request.auth.token.email in
          get(/databases/$(database)/documents/plannerAccess/team).data.admins;
   }
   match /events/{id} {
     allow read, write: if eventAdmin();
   }
   match /eventSettings/{doc} {
     allow read, write: if eventAdmin();
   }
   ```

   The Cloud Functions write with admin access and aren't bound by these.
2. **Deploy the functions.** `firebase deploy --only functions`. This updates
   `sendInquiry` and adds `doughReminders`, `wrapUpOptions` and `submitWrapUp`
   (Cloud Scheduler is already on for the planner's hourly refresh).
3. **Wrap-up access.** Open `/events/wrapup` as an admin; it lists anything
   still missing, with the service account email to use:
   - Share the money tracker sheet with that email as **Editor** (it was view
     only for the planner).
   - In Google Calendar, share the business calendar with that email:
     "See all event details".
   - Turn on the Google Calendar API for the project if the page says it's off.
   Keep the Google Form as a backup or turn off "Accepting responses".
4. **Set your prices.** Open `/events` → Pricing. Set the tax rate, deposit,
   and the add-on prices, and check the lead days for poolish and mix.

Hosting deploys on merge to `main` as before.
