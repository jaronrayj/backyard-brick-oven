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
| Who can use it | The team list, admins and staff (see [team.md](team.md)) |
| Sheet refresh | `functions/planner.js`: `refreshPlannerData` (the admin "Refresh from sheets" button) and `refreshPlannerHourly` |

The function reads only these ranges: dough counts, "could have sold more",
event name and date from the money tracker (no money columns), plus the dough
recipe and planner settings tabs of the Dough calculator, and the Topping
amounts, Sauce recipes and Store sections tabs of the pizza selection sheet.
The menu itself comes from the website's own list (Realtime Database
`pizzas/`, edited at `/admin/menu`).

## One-time setup

1. **People.** Add them to the team list ([team.md](team.md)).
2. **Share the sheets.** Open `/planner` as an admin and tap "Refresh from
   sheets". The first time, it says which service account email to share the
   three sheets with. Share them, then tap refresh again. The hourly refresh
   keeps it current after that. (The money tracker needs Editor access for
   the wrap-up page; the other two can stay view only.)

Rules and functions deploy from the repo ([team.md](team.md)).

## What to bring

The Shopping tab's "What to bring" list has two parts. The top comes from the
plan: dough balls, each sauce the picked pizzas use, and their toppings. Below
are your own items (`plan.bring`), each tagged with who it's for (every
service, Pizza Friday, any catered event, or one service type) and optionally
a count of one per so many guests or dough balls. Only items for the kinds of
services on the Plan tab show; "Edit list" shows all of them. Older items
without a tag count as "Every service".

Hosting deploys on merge to `main` as before.
