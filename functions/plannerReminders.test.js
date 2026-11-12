import test from "node:test";
import assert from "node:assert/strict";
import { plannerDue, plannerLead } from "./plannerReminders.js";

const plan = { tweaks: {}, services: [{ id: "a", date: "2026-11-13", type: "pf", balls: 120 }, { id: "b", date: "2026-11-13", type: "wedding", name: "Smith wedding" }] };

test("poolish the evening before mix day, mix day two days before service", () => {
  assert.deepEqual(plannerDue(plan, 2, "2026-11-10").map((d) => d.step), ["poolish"]);
  assert.deepEqual(plannerDue(plan, 2, "2026-11-11").map((d) => d.step), ["mix"]);
  assert.deepEqual(plannerDue(plan, 2, "2026-11-12"), []);
});

test("services sharing a mix day share one reminder, with names and balls", () => {
  const [d] = plannerDue(plan, 2, "2026-11-10");
  assert.deepEqual(d.services.map((s) => [s.name, s.balls]), [["Pizza Friday", 120], ["Smith wedding", null]]);
  assert.equal(d.key, "poolish|2026-11-11");
});

test("already sent is skipped; the Planner's own lead wins over the sheet's", () => {
  assert.deepEqual(plannerDue(plan, 2, "2026-11-10", { "poolish|2026-11-11": "2026-11-10" }), []);
  assert.equal(plannerLead({ tweaks: { lead: 1 } }, 2), 1);
  assert.equal(plannerLead({ tweaks: {} }, 3), 3);
  assert.deepEqual(plannerDue({ ...plan, tweaks: { lead: 1 } }, 2, "2026-11-11").map((d) => d.step), ["poolish"]);
});

test("past services and services without a date are ignored", () => {
  assert.deepEqual(plannerDue({ services: [{ date: "2026-11-01" }, { date: "" }] }, 2, "2026-11-02"), []);
  assert.deepEqual(plannerDue({ services: [{ date: "2026-11-01" }] }, 2, "2026-10-30").map((d) => d.step), ["mix"]);
});

test("a dough day moved on the Prep tab moves the reminders", () => {
  const moved = { services: [{ date: "2026-11-13", type: "pf", prepOn: "2026-11-12" }] };
  assert.deepEqual(plannerDue(moved, 2, "2026-11-11").map((d) => d.step), ["poolish"]);
  assert.deepEqual(plannerDue(moved, 2, "2026-11-12").map((d) => d.step), ["mix"]);
  assert.deepEqual(plannerDue(moved, 2, "2026-11-10"), []);
});
