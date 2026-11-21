// Who's on the team: one list, Firestore `plannerAccess/team`
// ({ admins: [emails], staff: [emails] }). Admins get the menu, planner,
// events and wrap-up; staff get the planner.
//
// Database, Storage and Firestore rules can't read that document from each
// other's rules, so each person's sign-in carries a `team` tag ("admin" or
// "staff") copied from the list: `syncTeamClaims` does it whenever the list
// changes, and `refreshMyAccess` lets a page catch up for someone who signed
// in for the first time after being added. Cloud Functions check the list
// itself (`roleFor`), so they never wait on a tag.
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { applyTeamChange, TeamChangeError } from "./teamList.js";

if (!getApps().length) initializeApp();

const lower = (list) => (list || []).map((e) => String(e).trim().toLowerCase()).filter(Boolean);

// "admin", "staff" or null for an email, given the list's data.
export const roleIn = (data, email) => {
  const e = String(email || "").toLowerCase();
  if (!e || !data) return null;
  if (lower(data.admins).includes(e)) return "admin";
  if (lower(data.staff).includes(e)) return "staff";
  return null;
};

export const roleFor = async (email) =>
  roleIn((await getFirestore().doc("plannerAccess/team").get()).data(), email);

// Throws unless the caller is signed in, verified and has one of `roles`.
export const requireRole = async (request, roles, message) => {
  const token = request.auth?.token;
  const role = token?.email_verified ? await roleFor(token.email) : null;
  if (!roles.includes(role)) throw new HttpsError("permission-denied", message);
  return role;
};

const setRole = async (uid, current, role) => {
  if ((current.team || null) === role) return false;
  const next = { ...current };
  if (role) next.team = role;
  else delete next.team;
  await getAuth().setCustomUserClaims(uid, next);
  return true;
};

export const syncTeamClaims = onDocumentWritten("plannerAccess/team", async (event) => {
  const before = event.data?.before?.data() || {};
  const after = event.data?.after?.data() || {};
  const emails = new Set([...lower(before.admins), ...lower(before.staff), ...lower(after.admins), ...lower(after.staff)]);
  for (const email of emails) {
    try {
      const user = await getAuth().getUserByEmail(email);
      if (await setRole(user.uid, user.customClaims || {}, roleIn(after, email))) logger.info(`Team tag updated for ${email}`);
    } catch (e) {
      if (e.code !== "auth/user-not-found") logger.error(`Couldn't update the team tag for ${email}`, e);
    }
  }
});

// Called by team pages on load. Returns { role, changed }; when changed, the
// page refreshes its sign-in so the rules see the new tag.
export const refreshMyAccess = onCall({ invoker: "public" }, async (request) => {
  const token = request.auth?.token;
  if (!token) throw new HttpsError("unauthenticated", "Sign in first.");
  const role = token.email_verified ? await roleFor(token.email) : null;
  const user = await getAuth().getUser(request.auth.uid);
  const changed = await setRole(user.uid, user.customClaims || {}, role);
  return { role, changed };
});

// The team home's "Team members" (admins): add someone, change their role or
// remove them. The change is checked by applyTeamChange (no removing yourself
// or the last admin) and written in a transaction; syncTeamClaims then updates
// everyone's sign-in tag. Returns the new { admins, staff }.
export const updateTeamList = onCall({ invoker: "public" }, async (request) => {
  await requireRole(request, ["admin"], "Only admins can change the team list.");
  const ref = getFirestore().doc("plannerAccess/team");
  try {
    const next = await getFirestore().runTransaction(async (tx) => {
      const out = applyTeamChange((await tx.get(ref)).data(), request.data || {}, request.auth.token.email);
      tx.set(ref, out, { merge: true });
      return out;
    });
    logger.info(`Team list changed by ${request.auth.token.email}: ${JSON.stringify(request.data)}`);
    return next;
  } catch (e) {
    if (e instanceof TeamChangeError) throw new HttpsError("failed-precondition", e.message);
    logger.error("Team list change failed", e);
    throw new HttpsError("internal", "Couldn't save the team list. Try again.");
  }
});
