import test from "node:test";
import assert from "node:assert/strict";
import { eventLink, wrapUpLink, LINKS } from "./links.js";

test("eventLink opens one event on Events, or the list without an id", () => {
  assert.equal(eventLink("abc123"), "/events?event=abc123");
  assert.equal(eventLink(null), "/events");
  assert.equal(eventLink("a/b c"), "/events?event=a%2Fb%20c");
});

test("wrapUpLink opens the form for a single event, else the tab", () => {
  assert.equal(wrapUpLink([{ key: "e:abc" }]), "/planner?key=e%3Aabc#wrapup");
  assert.equal(wrapUpLink([{ key: "e:a" }, { key: "c:b" }]), "/planner#wrapup");
  assert.equal(wrapUpLink([]), "/planner#wrapup");
});

test("fixed links point at the Planner tabs", () => {
  assert.equal(LINKS.dough, "/planner#prep");
  assert.equal(LINKS.morning, "/planner#calendar");
});
