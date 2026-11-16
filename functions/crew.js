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

// ["Crew for Pizza Friday: Libby 4–8 pm, Ben 5–8 pm (maybe)", ...] for today's services.
export const crewToday = (plan, today) =>
  ((plan && plan.services) || [])
    .filter((s) => s.date === today && Array.isArray(s.crew))
    .map((s) => {
      const people = s.crew
        .filter((c) => String(c.name || "").trim())
        .map((c) => `${String(c.name).trim()}${range(c) ? ` ${range(c)}` : ""}${c.status === "maybe" ? " (maybe)" : ""}`);
      return people.length ? `Crew for ${String(s.name || "").trim() || TYPE_NAMES[s.type] || "today"}: ${people.join(", ")}` : null;
    })
    .filter(Boolean);
