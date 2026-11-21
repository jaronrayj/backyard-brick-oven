import test from "node:test";
import assert from "node:assert/strict";
import { welcomeEmail, utahDay, WELCOME_DAILY_CAP, firstName } from "./welcomeText.js";

const extras = {
  photos: { breadsticks: "https://img.example/bread.jpg", fzookie: "https://img.example/fz.jpg" },
  fridays: ["2026-11-27", "2026-12-04"],
  signedUp: new Date("2026-11-21T01:07:00Z"), // Nov 20 in Utah
};

test("greets by a capitalized first name, or generically", () => {
  assert.equal(firstName("jaron johnson"), "Jaron");
  assert.equal(firstName("  "), "");
  assert.match(welcomeEmail("jaron").text, /You're on the list, Jaron!/);
  assert.match(welcomeEmail("").text, /You're on the list!/);
  assert.match(welcomeEmail("<b>x</b>").html, /&lt;b&gt;x&lt;\/b&gt;/);
  assert.doesNotMatch(welcomeEmail("<b>x</b>").html, /<b>x<\/b>/);
});

test("leads with dessert, says what a F'Zookie is, and where to redeem", () => {
  const { subject, text, html } = welcomeEmail("Sam", extras);
  assert.match(subject, /free dessert/i);
  for (const s of [text, html]) {
    assert.match(s, /FREE Dessert/);
    assert.match(s, /or Breadsticks/);
    assert.match(s, /half-baked chocolate chip cookie with homemade whipped cream/);
    assert.match(s, /any future Backyard Brick Oven service/);
    assert.match(s, /Weddings • Parties • Pizza Classes/);
    assert.doesNotMatch(s, /any Pizza Friday/);
  }
  assert.ok(html.indexOf("F'Zookie") < html.indexOf("Roasted Garlic Breadsticks"), "dessert comes first");
});

test("uses the poster colors", () => {
  const { html } = welcomeEmail("Sam", extras);
  assert.match(html, /#1f2d56/i); // navy
  assert.match(html, /#fbf5eb/i); // cream
  assert.match(html, /#b07a3a/i); // gold
});

test("has follow links, booking and a way out", () => {
  const { text, html } = welcomeEmail("Sam", extras);
  for (const s of [text, html]) {
    assert.match(s, /instagram\.com\/backyard_brick_oven/);
    assert.match(s, /facebook\.com/);
    assert.match(s, /\/inquiries/);
    assert.match(s, /unsubscribe/);
  }
});

test("looks like the hello page: logo, treat photos and the sign-up date", () => {
  const { html, text } = welcomeEmail("Sam", extras);
  assert.match(html, /backyardbrickovenpizza\.com\/email-logo\.png/);
  assert.match(html, /img\.example\/bread\.jpg/);
  assert.match(html, /img\.example\/fz\.jpg/);
  assert.match(html, /Signed up Fri, Nov 20|Signed up Thu, Nov 20/);
  assert.match(text, /Nov 20/);
});

test("lists the next Pizza Fridays with add-to-calendar links", () => {
  const { html, text } = welcomeEmail("Sam", extras);
  for (const s of [html, text]) {
    assert.match(s, /Fri, Nov 27/);
    assert.match(s, /Fri, Dec 4/);
    assert.match(s, /pizza-fridays\.ics/);
  }
  assert.match(html, /webcal:\/\/backyardbrickovenpizza\.com\/pizza-fridays\.ics/);
  assert.match(html, /calendar\.google\.com/);
});

test("still reads well without photos or dates", () => {
  const { html, text } = welcomeEmail("Sam");
  assert.doesNotMatch(html, /<img[^>]+img\.example/);
  assert.match(html, /Roasted Garlic Breadsticks/);
  assert.doesNotMatch(text, /Next:/);
  assert.match(text, /5–7:30 pm/);
});

test("the day is Utah's, and the cap leaves room under Gmail's limit", () => {
  assert.equal(utahDay(new Date("2026-11-15T05:30:00Z")), "2026-11-14");
  assert.ok(WELCOME_DAILY_CAP <= 200);
});
