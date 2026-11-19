import test from "node:test";
import assert from "node:assert/strict";
import { signupMessage, replyMessage } from "./crewSignups.js";

test("sign-up notification text", () => {
  assert.deepEqual(signupMessage({ name: "Ben", date: "2026-11-20", from: "17:30", to: "20:00" }), {
    title: "Ben is planning to come",
    body: "Fri, Nov 20, 5:30 pm–8 pm. Add them to the crew in the Planner.",
  });
  assert.equal(signupMessage({}).title, "Someone is planning to come");
});

test("crew answer notification text", () => {
  assert.deepEqual(replyMessage({ name: "Libby", date: "2026-11-20", status: "no" }), {
    title: "Libby can't make it",
    body: "Fri, Nov 20. See the crew in the Planner.",
  });
  assert.equal(replyMessage({ name: "Ben", date: "2026-11-21", status: "yes" }).title, "Ben is coming");
});
