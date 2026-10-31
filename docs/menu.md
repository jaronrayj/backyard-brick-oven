# Menu manager

`/admin/menu` edits the website menu directly in the Realtime Database
(`pizzas/`): add a pizza, edit name, toppings and photo, turn it on or off the
menu, mark the special of the week, and set the order the homepage shows.
It replaces editing the "pizza selection - bybo" sheet.

## Data

`pizzas/<key>`: `{ name, toppings, img, active, special, order }`.
`toppings` is one comma-separated string. Pizzas with an `order` number come
first, lowest first; the rest follow by name (`sortPizzas` in `src/utils`).
Photos upload to Firebase Storage under `pizzas/`, scaled to 1600px wide.

## Who can edit

Two lists in the Firebase console:

| What | Where | How to add someone |
| --- | --- | --- |
| Edit the menu | Realtime Database, `menuAdmins` | Add a child: key = their Google email with every `.` replaced by `,` (e.g. `jj,backyardbrickoven@gmail,com`), value `true` |
| Upload menu photos | Storage rules (below) | Add their email to the list in the rule |

They sign in at `/admin/menu` with that Google account.

## One-time setup

1. **Realtime Database rules.** Merge these into the existing rules (keep
   whatever is already there for other paths):

   ```json
   {
     "rules": {
       "pizzas": {
         ".read": true,
         ".write": "auth != null && auth.token.email_verified == true && root.child('menuAdmins').child(auth.token.email.replace('.', ',')).val() == true"
       },
       "menuAdmins": {
         "$email": {
           ".read": "auth != null && auth.token.email.replace('.', ',') == $email"
         }
       }
     }
   }
   ```

2. **Storage rules** (console → Storage → Rules; turn Storage on first if it
   isn't). The emails are listed in the rule because checking Firestore from
   Storage rules needs an extra IAM grant that failed to provision:

   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /pizzas/{file} {
         allow read: if true;
         allow write: if request.auth != null
           && request.auth.token.email_verified == true
           && request.auth.token.email in [
             'jj.backyardbrickoven@gmail.com',
             'jaronjohnson14@gmail.com',
             'bublegum.pop@gmail.com'
           ]
           && request.resource.size < 10 * 1024 * 1024
           && request.resource.contentType.matches('image/.*');
       }
     }
   }
   ```

3. **Retire the sheet sync.** Once the menu page works, open the
   "pizza selection - bybo" Apps Script project, go to Triggers (clock icon)
   and delete the "importSheet / On change" trigger. Otherwise the next edit to
   that sheet copies the sheet over the menu and undoes changes made here
   (including the order).
