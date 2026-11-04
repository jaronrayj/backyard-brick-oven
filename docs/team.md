# Team access

One list decides who can use the team tools: the Firestore document
`plannerAccess/team`, with two array fields of Google account emails.

| Role | Gets |
| --- | --- |
| `admins` | Menu manager, planner (with "Refresh now" for the sheets), events and quotes, wrap-up, the dashboard link |
| `staff` | Dough planner |

To add or remove someone, edit that document in the Firebase console. They
sign in at `/team` with that Google account.

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
