# Dough planner

`/planner` plans dough, pizzas, shopping and prep for upcoming services. Staff
sign in with Google; nobody needs access to the Google Sheets.

## How it fits together

| Piece | Where |
| --- | --- |
| Page | `src/pages/Planner/` (`planner.js` is plain DOM code, `index.js` wraps it for React and handles sign-in) |
| Recipe, menu, toppings, sauces, settings, recent Pizza Fridays | Firestore `planner/ref`, written only by the Cloud Function |
| Services, picked pizzas, counts, tweaks | Firestore `planner/plan` |
| Shopping and prep checkmarks | Firestore `planner/checks` |
| Who can use it | Firestore `plannerAccess/team`: `{ admins: [emails], staff: [emails] }` |
| Sheet refresh | `functions/planner.js`: `refreshPlannerData` (the admin "Refresh from sheets" button) and `refreshPlannerHourly` |

The function reads only these ranges: dough counts, "could have sold more",
event name and date from the money tracker (no money columns), plus the dough
recipe and planner settings tabs of the Dough calculator, and the pizzas,
Topping amounts, Sauce recipes and Store sections tabs of the pizza selection
sheet.

## One-time setup

1. **Access list.** In the Firestore console create the document
   `plannerAccess/team` with two array fields:
   `admins: ["jj.backyardbrickoven@gmail.com"]` and `staff: []`. Add staff
   emails (their Google accounts) to `staff` to let them in.
2. **Security rules.** Add these inside `match /databases/{database}/documents`
   in the Firestore rules (console → Firestore → Rules), next to the existing
   rules:

   ```
   match /plannerAccess/{doc} {
     allow read: if request.auth != null;
     allow write: if false;
   }
   match /planner/{doc} {
     function team() {
       return get(/databases/$(database)/documents/plannerAccess/team).data;
     }
     function onTeam() {
       return request.auth != null
         && request.auth.token.email_verified == true
         && (request.auth.token.email in team().staff
             || request.auth.token.email in team().admins);
     }
     allow read: if onTeam();
     allow write: if onTeam() && doc in ['plan', 'checks'];
   }
   ```

   `planner/ref` is written by the Cloud Function, which is not bound by rules.
3. **Deploy the functions.** `cd functions && npm install && cd .. && firebase deploy --only functions`.
   `npm install` also updates `functions/package-lock.json` for the new
   `firebase-admin` dependency; commit that change.
4. **Share the sheets.** Open `/planner` as an admin and tap "Refresh from
   sheets". The first time, it says which service account email to share the
   three sheets with (view only). Share them, then tap refresh again.
   The hourly refresh keeps it current after that.

Hosting deploys on merge to `main` as before.
