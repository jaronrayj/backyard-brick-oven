import test from "node:test";
import assert from "node:assert/strict";
import { crewToday } from "./crew.js";

test("crew today, for the morning summary", () => {
  const plan = {
    services: [
      {
        name: "",
        type: "pf",
        date: "2026-11-20",
        crew: [
          { name: "Libby", from: "16:00", to: "20:00", status: "yes" },
          { name: "Ben", from: "17:30", to: "20:00", status: "maybe" },
          { name: "  ", from: "16:00", to: "20:00" },
          { name: "Julia", from: "11:00", to: "14:00" },
          { name: "Hazel" },
        ],
      },
      { name: "Wrestling event", date: "2026-11-21", crew: [{ name: "Libby", from: "11:30", to: "21:30" }] },
      { name: "No crew yet", date: "2026-11-20", crew: [] },
    ],
  };
  assert.deepEqual(crewToday(plan, "2026-11-20"), ["Crew for Pizza Friday: Libby 4–8 pm, Ben 5:30–8 pm (maybe), Julia 11 am–2 pm, Hazel"]);
  assert.deepEqual(crewToday(plan, "2026-11-21"), ["Crew for Wrestling event: Libby 11:30 am–9:30 pm"]);
  assert.deepEqual(crewToday(plan, "2026-11-22"), []);
  assert.deepEqual(crewToday(undefined, "2026-11-20"), []);
});
