// Where each phone notification opens (paths on the site). The page code
// handles them: Events opens ?event=<id>, the Planner switches to the #tab,
// and the Wrap up tab opens ?key=<wrap-up key> straight to its form.

export const LINKS = {
  dough: "/planner#prep", // dough happens on the Prep tab's days
  morning: "/planner#calendar",
};

export const eventLink = (id) => (id ? `/events?event=${encodeURIComponent(id)}` : "/events");

export const wrapUpLink = (due) =>
  due.length === 1 ? `/planner?key=${encodeURIComponent(due[0].key)}#wrapup` : "/planner#wrapup";
