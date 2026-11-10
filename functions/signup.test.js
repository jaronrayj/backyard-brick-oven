import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TEXT_CONSENT, checkSignup, looksLikePhone, newCode, prettyPhone, readContact, usPhone } from "./signupText.js";

test("the /hello page uses the same rules and consent text as the function", () => {
  const here = readFileSync(new URL("./signupText.js", import.meta.url), "utf8");
  const site = readFileSync(new URL("../src/pages/Hello/signupText.js", import.meta.url), "utf8");
  assert.equal(site, here, "copy functions/signupText.js to src/pages/Hello/signupText.js");
});

test("US phone numbers in any common format", () => {
  assert.equal(usPhone("(801) 872-3439"), "+18018723439");
  assert.equal(usPhone("801.872.3439"), "+18018723439");
  assert.equal(usPhone("+1 801 872 3439"), "+18018723439");
  assert.equal(usPhone("18018723439"), "+18018723439");
  assert.equal(usPhone("872-3439"), "");
  assert.equal(usPhone("0018723439"), "");
  assert.equal(prettyPhone("+18018723439"), "(801) 872-3439");
});

test("phone or email", () => {
  assert.deepEqual(readContact(" Sam@Example.com "), { type: "email", contact: "sam@example.com" });
  assert.deepEqual(readContact("801-872-3439"), { type: "phone", contact: "+18018723439" });
  assert.deepEqual(readContact("sam@example"), { type: "", contact: "" });
  assert.deepEqual(readContact("hello"), { type: "", contact: "" });
  assert.equal(looksLikePhone("801"), true);
  assert.equal(looksLikePhone("80"), false);
  assert.equal(looksLikePhone("sam1234@x.com"), false);
});

test("sign-up checks: name, contact, consent only for phones", () => {
  assert.match(checkSignup({ contact: "a@b.com" }).error, /first name/);
  assert.match(checkSignup({ name: "Sam" }).error, /phone number or email/);
  assert.match(checkSignup({ name: "Sam", contact: "12" }).error, /doesn't look right/);
  assert.match(checkSignup({ name: "Sam", contact: "801-872-3439" }).error, /check the box/);
  assert.match(checkSignup({ name: "Sam", contact: "801-872-3439", consent: "true" }).error, /check the box/);
  assert.match(checkSignup({ name: "x".repeat(61), contact: "a@b.com" }).error, /long/);
  assert.deepEqual(checkSignup({ name: "  Sam  ", contact: "801-872-3439", consent: true }), {
    name: "Sam", type: "phone", contact: "+18018723439", consent: true,
  });
  // Email sign-ups never count as agreeing to texts.
  assert.deepEqual(checkSignup({ name: "Sam", contact: "a@b.com", consent: true }), {
    name: "Sam", type: "email", contact: "a@b.com", consent: false,
  });
  assert.match(TEXT_CONSENT, /Reply STOP to opt out\.$/);
});

test("codes are short and easy to read out", () => {
  assert.match(newCode(), /^BYBO-[ACDEFGHJKMNPQRTUVWXY34679]{4}$/);
  assert.equal(newCode(() => 0), "BYBO-AAAA");
  assert.equal(newCode(() => 0.9999), "BYBO-9999");
});
