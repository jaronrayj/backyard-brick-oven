// Recent things to wrap up: tracker events with their calendar entries matched
// by date, then calendar entries the tracker doesn't have. Newest first.
export const buildChoices = (events, calendar, today) => {
  const used = new Set()
  const out = events
    .filter((e) => e.date <= today)
    .map((e) => {
      const cal = calendar.filter((c) => c.date === e.date)
      cal.forEach((c) => used.add(c.id))
      return {
        key: `e:${e.id}`,
        eventId: e.id,
        title: e.name,
        sub: e.eventType,
        date: e.date,
        wrappedUp: e.wrappedUp,
        skipped: !!e.skipped,
        name: /pizza friday/i.test(`${e.eventType} ${e.name}`) ? 'Pizza Friday' : e.name,
        info: [e.time, e.location, e.guests ? `${e.guests} guests` : ''].filter(Boolean).join(' · '),
        notes: [e.notes, ...cal.map((c) => c.notes)].filter(Boolean),
        calendarTitles: cal.map((c) => c.title),
      }
    })
  calendar
    .filter((c) => !used.has(c.id) && c.date <= today)
    .forEach((c) =>
      out.push({
        key: `c:${c.id}`,
        eventId: null,
        title: c.title || 'Calendar event',
        sub: 'From your calendar',
        date: c.date,
        wrappedUp: !!c.wrappedUp,
        skipped: !!c.skipped,
        name: /pizza friday/i.test(c.title) ? 'Pizza Friday' : /\bprep\b/i.test(c.title) ? 'Prep' : c.title,
        info: [c.time, c.location].filter(Boolean).join(' · '),
        notes: c.notes ? [c.notes] : [],
        calendarTitles: [],
      })
    )
  return out.sort((a, b) => b.date.localeCompare(a.date))
}
