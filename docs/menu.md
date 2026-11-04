# Menu manager

`/admin/menu` edits the website menu directly in the Realtime Database
(`pizzas/`): add a pizza, edit name, toppings and photo, turn it on or off the
menu, mark the special of the week, and set the order the homepage shows.
It replaces editing the "pizza selection - bybo" sheet.

## Data

`pizzas/<key>`: `{ name, toppings, img, active, special, order }`.
`toppings` is one comma-separated string. Pizzas with an `order` number come
first, lowest first; the rest follow by name (`sortPizzas` in `src/utils`).
Photos open in a crop/rotate editor (`PhotoEditor.js`), then upload to Firebase
Storage under `pizzas/`, scaled to 1200px wide and
cached by browsers for a year. Google Photos links (`lh3.googleusercontent.com`)
are copied into Storage by the `importMenuPhoto` Cloud Function, when a pizza is
saved with one or with the "Move photos" button; the old link is kept in
`imgGooglePhotos`.

## Who can edit

Admins on the team list (see [team.md](team.md)). They sign in at `/admin/menu`
or `/team` with that Google account. Photo uploads use the same check.

## One-time setup

**Retire the sheet sync.** Open the "pizza selection - bybo" Apps Script
project, go to Triggers (clock icon) and delete the "importSheet / On change"
trigger. Otherwise the next edit to that sheet copies the sheet over the menu
and undoes changes made here (including the order).

## Small copies

Each menu photo gets a 600 px copy in Storage `pizzas/thumbs/` (about 50 KB),
saved on the pizza as `thumb` (with `thumbOf`, the photo it came from). The
server makes it whenever a pizza's `img` changes (`menuThumbOnPhoto` in
`functions/menuPhotos.js`); `makeMenuThumbs` fills in any that are missing.
The Menu list and the website's menu cards show `thumb`; zooming in on the
website opens the full photo.
