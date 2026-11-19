// Crew lines for the morning summary (push.js), from the Planner's plan
// (planner/plan, services[].crew; the Planner edits it, src/pages/Planner).

const clock12 = (v, short) => {
  if (!/^\d{1,2}:\d{2}$/.test(String(v || ""))) return ""; // no time set
  const [h, m] = String(v).split(":").map(Number);
  return `${h % 12 || 12}${short && !m ? "" : `:${String(m || 0).padStart(2, "0")}`} ${h < 12 ? "am" : "pm"}`;
};
const range = (c) => {
  const a = clock12(c.from, true);
  const b = clock12(c.to, true);
  if (!a || !b) return a || b;
  return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)}–${b}` : `${a}–${b}`;
};
const TYPE_NAMES = { pf: "Pizza Friday", wedding: "Wedding", sides: "Party", meal: "Event", bread: "Bread" };

const lowerEmail = (e) => String(e || "").trim().toLowerCase();
// The crew member's own answer for a row (crewReplies), if the row is tied to their login.
const replyOf = (replies, s, c) =>
  (replies || []).find((r) => r.serviceId === s.id && ((c.signupUid && r.uid === c.signupUid) || (c.email && lowerEmail(r.email) === lowerEmail(c.email))));
const NOTE = { maybe: " (maybe)", no: " (can't make it)" };

// ["Crew for Pizza Friday: Libby 4–8 pm, Ben 5–8 pm (maybe)", ...] for today's services.
// replies: crewReplies docs; a crew member's own answer wins over the row's status.
export const crewToday = (plan, today, replies = []) =>
  ((plan && plan.services) || [])
    .filter((s) => s.date === today && Array.isArray(s.crew))
    .map((s) => {
      const people = s.crew
        .filter((c) => String(c.name || "").trim())
        .map((c) => {
          const r = replyOf(replies, s, c);
          const note = r ? NOTE[r.status] || "" : c.status === "maybe" ? " (maybe)" : "";
          return `${String(c.name).trim()}${range(c) ? ` ${range(c)}` : ""}${note}`;
        });
      return people.length ? `Crew for ${String(s.name || "").trim() || TYPE_NAMES[s.type] || "today"}: ${people.join(", ")}` : null;
    })
    .filter(Boolean);
