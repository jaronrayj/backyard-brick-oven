// Dough reminders for the Planner's services (planner/plan), the same days the
// Prep tab shows: poolish the evening before mix day, mix day `lead` days before
// the service. Services that share a mix day share one reminder.
// Kept free of Firebase imports so it tests on its own. Same date math as events.js.
const addDays = (iso, days) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const TYPE_NAMES = { pf: "Pizza Friday", wedding: "Wedding", sides: "Party", meal: "Party", bread: "Bread" };
export const plannerServiceName = (s) => (s.name && String(s.name).trim()) || TYPE_NAMES[s.type] || "Service";

// The Planner's mix lead: its own tweak, else the sheet's setting (passed in), like the Prep tab.
export const plannerLead = (plan, sheetLead) => {
  const v = Number(plan && plan.tweaks && plan.tweaks.lead);
  return Number.isFinite(v) && plan.tweaks.lead !== "" && plan.tweaks.lead != null ? Math.max(0, Math.min(5, v)) : sheetLead;
};

// [{step: "poolish" | "mix", key, mix, services: [{name, date, balls}]}] due today and not yet sent.
export const plannerDue = (plan, sheetLead, today, sent = {}) => {
  const lead = plannerLead(plan, sheetLead);
  const services = ((plan && plan.services) || []).filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s.date || "") && s.date >= today);
  const byMix = new Map();
  for (const s of services) {
    // A day moved on the Prep tab (prepOn) wins, as on the Planner.
    const mix = /^\d{4}-\d{2}-\d{2}$/.test(s.prepOn || "") && s.prepOn <= s.date ? s.prepOn : addDays(s.date, -lead);
    if (!byMix.has(mix)) byMix.set(mix, []);
    byMix.get(mix).push({ name: plannerServiceName(s), date: s.date, balls: s.type !== "bread" && Number(s.balls) > 0 ? Number(s.balls) : null, bread: s.type === "bread" });
  }
  const out = [];
  for (const [mix, list] of byMix) {
    for (const [step, day] of [["poolish", addDays(mix, -1)], ["mix", mix]]) {
      const key = `${step}|${mix}`;
      if (day === today && !sent[key]) out.push({ step, key, mix, services: list.sort((a, b) => a.date.localeCompare(b.date)) });
    }
  }
  return out;
};
