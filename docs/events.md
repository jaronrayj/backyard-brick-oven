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
   `sendInquiry` and adds `doughReminders` (Cloud Scheduler is already on for
   the planner's hourly refresh).
3. **Set your prices.** Open `/events` → Pricing. Set the tax rate, deposit,
   and the add-on prices, and check the lead days for poolish and mix.

Hosting deploys on merge to `main` as before.
