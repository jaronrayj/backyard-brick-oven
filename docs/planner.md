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
| Sheet refresh | `functions/planner.js`: `refreshPlannerData` (the admin "Refresh now" link under "Yeast, water and timing") and `refreshPlannerHourly` |

The function reads only these ranges: dough counts, "could have sold more",
event name and date from the money tracker (no money columns), plus the dough
recipe and planner settings tabs of the Dough calculator, and the Topping
amounts, Sauce recipes and Store sections tabs of the pizza selection sheet.
The menu itself comes from the website's own list (Realtime Database
`pizzas/`, edited at `/admin/menu`).

**Pizzas.** The Pizzas card lists the pizzas on the website, then older
pizzas that are off the website (collapsed), so an event can use any pizza
you've made before. Edit or add pizzas at `/admin/menu`.

## One-time setup

1. **People.** Add them to the team list ([team.md](team.md)).
2. **Share the sheets.** Open `/planner` as an admin, open "Yeast, water
   and timing" and tap "Refresh now". The first time, it says which service account email to share the
   three sheets with. Share them, then tap refresh again. The hourly refresh
   keeps it current after that. (The money tracker needs Editor access for
   the wrap-up page; the other two can stay view only.)

Rules and functions deploy from the repo ([team.md](team.md)).

## Bread

A **Bread** service uses the same dough recipe, weighed out as loaves. Type
the number of loaves; each is 575 g unless you change "Grams per loaf" (or add
a `bread loaf weight (grams)` setting to the dough calculator). Loaves are
converted to pizza-ball units from the sheet's ball weight, so they share mix
days and mixer batches with pizza dough, add flour, salt and yeast to the
shopping list, and take no share of the toppings.

## From your calendar

Under Services, "From your calendar" lists the next two weeks of the business
calendar (the same one Wrap-up reads. "Clear finished services" (under Services, once a service's day has passed) removes past services (and their prep); upcoming services, picked pizzas, your own items and all checkmarks stay. On the Prep tab, a past day with anything unchecked stays under "Missed" until it's checked off; fully checked past days drop off. Admins also get a **Wrap up** tab: the wrap-up page (`src/pages/Events/WrapUp.js`, drawn into the tab by `index.js`), with a count of the last week's ended events still to wrap up; see docs/events.md. Pizzas are per service: each service keeps its own `picked`, `counts` and `manualCounts`, the Pizzas card switches between services ("Same pizzas as" copies another's mix), prep uses each service's own counts and shopping adds them all up. Plans saved before this get the old single list copied to every service once (`perService: true`); `plannerCalendar` in
`functions/planner.js`) that aren't planned yet. "Add" makes a normal service
you can edit: the calendar title becomes its name, "Pizza Friday" in the title
makes it a Pizza Friday, "wedding" a wedding, anything else a party, and the
guest count comes from "50 people" in the notes or a "-50" at the end of the
title (else 50). "Skip" hides an entry for good (`plan.calSkipped`). Entries
with "prep" in the title, and dates that already have a service, aren't
listed. If a linked entry moves on the calendar, the service offers the new
date.

## Shopping

The Shopping tab builds the list from the picked pizzas and the dough,
grouped by store section, with rough store amounts (ounces under a pound,
then half pounds, rounded up). "Add an item" puts your own things on it
(`plan.extras`: name and an optional amount), shown first under "Added" and
kept until you remove them with ✕.

**F'Zookies.** Type how many F'Zookies on the Plan tab, and the Shopping tab
adds a "For N F'Zookies" group from the money tracker's "f'zookie 50" tab:
each item there (column A) with the share of a store pack one batch uses
(column C, like 25%) and the batch size (G6, 45). It shows how many packs to
buy and how much of them you'll use, for example "butter: 1 pack, uses about
33% of it". Cost columns aren't read. Add a row to that tab and it shows up
after the next refresh.

## What to bring

The Bring tab's "What to bring" list has two parts. The top comes from the
plan: dough balls, each sauce the picked pizzas use, and their toppings. Below
are your own items (`plan.bring`), each tagged with who it's for (every
service, Pizza Friday, any catered event, or one service type) and optionally
a count of one per so many guests or dough balls. Only items for the kinds of
services on the Plan tab show; "Edit list" shows all of them. Older items
without a tag count as "Every service".

The list is split by where things are packed from: **At home** and **At the
commissary** (`plan.where`, keyed by item). "Edit list" gives every item,
including dough, each sauce and each topping, a Home / Commissary picker;
anything not set yet shows under "Not sorted yet". Toppings are one group with
a checkbox per topping, and ticking "Toppings" ticks them all at once.
↑ ↓ on each row put things in packing order within each section
(`plan.bringOrder`), on the list itself and in Edit list. The Toppings group
moves as one, and each topping can be moved within it.

Hosting deploys on merge to `main` as before.
