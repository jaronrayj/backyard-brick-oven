// Changes to the team list (Firestore plannerAccess/team: { admins, staff }),
// made from the team home's "Team members" (updateTeamList in team.js). No
// Firebase here, so it tests on its own (teamList.test.js).
//
// A change is { action: "set", email, role: "admin" | "staff" } (add someone or
// change their role) or { action: "remove", email }. It refuses anything that
// would lock people out: removing yourself, taking away your own admin access,
// or leaving no admins.

const EMAIL = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;
const lower = (list) => (list || []).map((e) => String(e).trim().toLowerCase()).filter(Boolean);

export class TeamChangeError extends Error {}
const refuse = (message) => {
  throw new TeamChangeError(message);
};

// The new { admins, staff } after the change, or throws TeamChangeError.
export const applyTeamChange = (data, change, myEmail) => {
  const email = String((change && change.email) || "").trim().toLowerCase();
  const me = String(myEmail || "").trim().toLowerCase();
  if (!EMAIL.test(email)) refuse("That doesn't look like an email address.");
  const without = (list) => lower(list).filter((e) => e !== email);
  const admins = without(data && data.admins);
  const staff = without(data && data.staff);

  if (change.action === "remove") {
    if (email === me) refuse("You can't remove yourself.");
  } else if (change.action === "set") {
    if (!["admin", "staff"].includes(change.role)) refuse("Pick a role: Crew or Admin.");
    if (email === me && change.role !== "admin") refuse("You can't take away your own admin access.");
    (change.role === "admin" ? admins : staff).push(email);
  } else {
    refuse("Unknown change.");
  }
  if (!admins.length) refuse("There has to be at least one admin.");
  return { admins, staff };
};
