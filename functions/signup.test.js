import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkSignup, readEmail } from "./signupText.js";

test("the /hello page uses the same rules as the function", () => {
  const here = readFileSync(new URL("./signupText.js", import.meta.url), "utf8");
  const site = readFileSync(new URL("../src/pages/Hello/signupText.js", import.meta.url), "utf8");
  assert.equal(site, here, "copy functions/signupText.js to src/pages/Hello/signupText.js");
});

test("emails are trimmed and lowercased; bad ones are refused", () => {
  assert.equal(readEmail(" Sam@Example.com "), "sam@example.com");
  assert.equal(readEmail("sam@example"), "");
  assert.equal(readEmail("sam example@x.com"), "");
  assert.equal(readEmail(`${"a".repeat(120)}@x.com`), "");
});

test("first name is optional; email is required", () => {
  assert.deepEqual(checkSignup({ email: "sam@example.com" }), { name: "", email: "sam@example.com" });
  assert.deepEqual(checkSignup({ name: "  Sam   Lee ", email: "SAM@example.com" }), { name: "Sam Lee", email: "sam@example.com" });
  assert.match(checkSignup({ name: "Sam" }).error, /email/);
  assert.match(checkSignup({ email: "nope" }).error, /doesn't look right/);
  assert.match(checkSignup({ name: "x".repeat(61), email: "a@b.co" }).error, /long/);
});
