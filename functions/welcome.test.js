import test from "node:test";
import assert from "node:assert/strict";
import { welcomeEmail, utahDay, WELCOME_DAILY_CAP } from "./welcomeText.js";

test("welcome email greets by first name, or generically", () => {
  assert.match(welcomeEmail("Sam Lee").text, /^Hi Sam,/);
  assert.match(welcomeEmail("").text, /^Hi there,/);
  assert.match(welcomeEmail("<b>x</b>").html, /Hi &lt;b&gt;x&lt;\/b&gt;,/);
});

test("welcome email has the freebie, follow links and a way out", () => {
  const { subject, text, html } = welcomeEmail("Sam");
  assert.match(subject, /free/i);
  for (const s of [text, html]) {
    assert.match(s, /Roasted Garlic Breadsticks or a F'Zookie/);
    assert.match(s, /instagram\.com\/backyard_brick_oven/);
    assert.match(s, /facebook\.com/);
    assert.match(s, /unsubscribe/);
  }
});

test("the day is Utah's, and the cap leaves room under Gmail's limit", () => {
  assert.equal(utahDay(new Date("2026-11-15T05:30:00Z")), "2026-11-14");
  assert.ok(WELCOME_DAILY_CAP <= 200);
});
