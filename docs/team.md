# Team access

One list decides who can use the team tools: the Firestore document
`plannerAccess/team`, with two array fields of Google account emails.

| Role | Gets |
| --- | --- |
| `admins` | Menu manager, planner (with "Refresh now" for the sheets), events and quotes, wrap-up, Money (Profit First transfers, [money.md](money.md)), the dashboard link |
| `staff` | The Planner, mostly to look at: the dough plan, pizzas, Calendar (with details), Prep and Bring (no Shopping tab). They can **check things off** on Prep and Bring; only admins change the plan (services, pizzas, settings) or add and remove list items. |

To add or remove someone, or change their role, use **Team members** on the
team home (`/team`, admins only; "Crew" is `staff`). It saves through the
`updateTeamList` function (`functions/team.js`, rules in `teamList.js`), which
won't let you remove yourself, take away your own admin access, or leave no
admins. Editing the document in the Firebase console still works too. They
sign in at `/team` with that Google account. It has to be a Google account,
verified, but not necessarily Gmail: an existing email can be made into one at
accounts.google.com ("use your existing email").

## View as crew

Admins have **View as crew** in the team bar: every page shows exactly what
staff see, with a "Viewing as crew · Back to admin" banner. It only changes
the pages (`useTeamRole` reports `role: "staff"`, with `realRole: "admin"` and
`viewingAsCrew`). The account keeps admin access, and the rules still go by
the real role. It's remembered on that browser until **Back to admin**.

## What crew can change

The Planner mounts with `canWrite` for admins only and `canCheck` for
everyone, so crew get a view-only plan with working checkboxes. The rules
match: `planner/plan` is written by admins only; `planner/checks` (the
checkmarks) by the whole team.

## How the rules know

Firestore, Realtime Database and Storage rules can't read each other's data,
so `functions/team.js` copies each person's role onto their sign-in as a
`team` tag whenever the list changes (`syncTeamClaims`), and every team page
asks the server to catch up on load (`refreshMyAccess`), then refreshes the
sign-in if the tag changed. All three rule files check that tag. Cloud
Functions check the list itself.

This replaces the old `menuAdmins` entries (emails with `.` as `,`) and the
email list inside the Storage rules. Those are gone.

## Rules live in the repo

`firestore.rules`, `database.rules.json` and `storage.rules` are deployed by
`.github/workflows/deploy-backend.yml` whenever they or `functions/` change on
`main`. Edits made in the Firebase console are overwritten by the next deploy,
so change the files instead.

## Phone app

Only team members are offered "Install app" / "Add to Home Screen" as an app:
`public/index.html` has no manifest link, and `src/utils/teamApp.js` adds it
once the team bar sees a signed-in team member. The installed app opens on
`/planner` (`start_url` in `public/manifest.json`). Visitors never get the
offer, though any browser can still make a plain home-screen bookmark.

## Crew answering for their own shift

On a Planner service, an admin ties each crew row to a login by picking the
person's email (rows added with **Add to crew** from a sign-up are tied
already). That person then sees **I'm coming / Maybe / Can't make it** on their
row and answers for themselves; admins see the answer as a badge on the row,
the crew count follows it, the morning summary marks "(can't make it)", and
admins get a phone notification when an answer changes.

- `crewReplies/{serviceId}__{uid}`: the latest answer (`yes`, `maybe`, `no`),
  written only by that person (`firestore.rules`).
- `crewHistory/{auto}`: every answer, sign-up and taken-back sign-up, written
  by the person themselves and never changed. Admins read it at
  **/admin/crew** (Crew history on the team home, not a tab), filterable by
  person.

