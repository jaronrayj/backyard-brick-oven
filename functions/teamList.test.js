import test from "node:test";
import assert from "node:assert/strict";
import { applyTeamChange } from "./teamList.js";

const team = { admins: ["jj@example.com"], staff: ["libby@example.com", "ben@example.com"] };
const me = "JJ@example.com";

test("adds someone as crew or admin, tidying the email", () => {
  assert.deepEqual(applyTeamChange(team, { action: "set", email: "  Hazel@Example.com ", role: "staff" }, me), {
    admins: ["jj@example.com"],
    staff: ["libby@example.com", "ben@example.com", "hazel@example.com"],
  });
  assert.deepEqual(applyTeamChange(team, { action: "set", email: "wife@example.com", role: "admin" }, me).admins, ["jj@example.com", "wife@example.com"]);
});

test("changing a role moves them between the lists, never in both", () => {
  const out = applyTeamChange(team, { action: "set", email: "libby@example.com", role: "admin" }, me);
  assert.deepEqual(out, { admins: ["jj@example.com", "libby@example.com"], staff: ["ben@example.com"] });
});

test("removes someone", () => {
  assert.deepEqual(applyTeamChange(team, { action: "remove", email: "ben@example.com" }, me).staff, ["libby@example.com"]);
});

test("works on an empty or missing list", () => {
  assert.deepEqual(applyTeamChange(undefined, { action: "set", email: "a@b.co", role: "admin" }, "a@b.co"), { admins: ["a@b.co"], staff: [] });
});

test("refuses changes that would lock people out or make no sense", () => {
  const no = (change, re) => assert.throws(() => applyTeamChange(team, change, me), re);
  no({ action: "remove", email: "jj@example.com" }, /yourself/);
  no({ action: "set", email: "jj@example.com", role: "staff" }, /your own admin/);
  no({ action: "set", email: "not an email", role: "staff" }, /email/);
  no({ action: "set", email: "x@example.com", role: "owner" }, /role/);
  no({ action: "delete-everyone", email: "x@example.com" }, /change/);
  assert.throws(() => applyTeamChange({ admins: ["solo@example.com"], staff: [] }, { action: "remove", email: "solo@example.com" }, "other@example.com"), /at least one admin/);
});
