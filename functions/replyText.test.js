import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEFAULT_AUTO_REPLY, detailRows, renderAutoReply, replyEventWords } from "./replyText.js";
import { inquiryToEvent } from "./events.js";

test("the Emails page preview uses the same code as the email", () => {
  const here = readFileSync(new URL("./replyText.js", import.meta.url), "utf8");
  const site = readFileSync(new URL("../src/pages/Events/replyText.js", import.meta.url), "utf8");
  assert.equal(site, here, "copy functions/replyText.js to src/pages/Events/replyText.js");
});

test("event words", () => {
  assert.equal(replyEventWords("Wedding"), "your wedding");
  assert.equal(replyEventWords("Birthday or family party"), "your party");
  assert.equal(replyEventWords("Bridal shower or bachelorette"), "your party");
  assert.equal(replyEventWords("Pizza class"), "your pizza class");
  assert.equal(replyEventWords("Corporate or work event"), "your event");
  assert.equal(replyEventWords(""), "your event");
});

// What the website form sends, run through the same conversion as a real inquiry.
const form = {
  name: "Kate and Ryan",
  event_type: "Wedding + Salad, Dessert",
  wedding_part: "Reception",
  event_for: "Our wedding",
  event_date: "2027-06-12",
  event_location: "Bountiful, UT",
  rough_event_time: "6:00 pm",
  estimated_guests: "85",
  contact: "kate@example.com / 801-555-0100",
  comments: "We'd love a gluten-free option.",
};

test("the default reply for a wedding inquiry", () => {
  const mail = renderAutoReply(DEFAULT_AUTO_REPLY, inquiryToEvent(form));
  assert.equal(mail.subject, "We got your request! 🍕");
  assert.equal(
    mail.text,
    [
      "Hi Kate and Ryan,",
      "",
      "Thanks for reaching out about your wedding! Here's what you sent us:",
      "",
      "- Event: Wedding (reception)",
      "- Date: Saturday, June 12, 2027",
      "- Service time: 6:00 pm",
      "- Where: Bountiful, UT",
      "- Guests: about 85",
      "- Extras: Salad, Dessert",
      '- Your note: "We\'d love a gluten-free option."',
      "",
      "I'll put together a written quote and send it within a day or two. If anything above is off, just reply to this email.",
      "",
      "You can see our pricing anytime at backyardbrickovenpizza.com/inquiries.",
      "",
      "Talk soon,",
      "Jaron",
      "Backyard Brick Oven · (801) 872-3439",
      "",
    ].join("\n")
  );
  assert.match(mail.html, /<li><b>Guests:<\/b> about 85<\/li>/);
  assert.match(mail.html, /<a href="https:\/\/backyardbrickovenpizza\.com\/inquiries">backyardbrickovenpizza\.com\/inquiries<\/a>\./);
  assert.doesNotMatch(mail.text + mail.html, /wood/i);
});

test("blank answers are left out; a business name gets 'Hi there'", () => {
  const e = inquiryToEvent({ ...form, name: "Acme Corp", event_type: "Corporate or work event", wedding_part: "", rough_event_time: "", comments: "" });
  const mail = renderAutoReply(DEFAULT_AUTO_REPLY, e);
  assert.match(mail.text, /^Hi there,/);
  assert.match(mail.text, /about your event!/);
  assert.doesNotMatch(mail.text, /Service time|Your note/);
  assert.deepEqual(detailRows({}), []);
});

test("your own wording, with {details} anywhere and HTML kept safe", () => {
  const mail = renderAutoReply({ subject: "Hi {name}!", body: "Thanks {name} <3\nGot these: {details} Talk soon." }, inquiryToEvent(form));
  assert.equal(mail.subject, "Hi Kate and Ryan!");
  assert.match(mail.text, /Got these: - Event: Wedding/);
  assert.match(mail.html, /Thanks Kate and Ryan &lt;3/);
  assert.match(mail.html, /<ul/);
  assert.doesNotMatch(mail.html, /\{details\}/);
});
