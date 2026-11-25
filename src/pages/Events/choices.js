// The saved sheet row for a wrapped-up choice. Opens a row only when its date
// and name both match exactly one; sameDay says how many rows share the date.
const plainName = (s) => String(s || '').trim().toLowerCase()
export const findRow = (rows, choice) => {
  const day = rows.filter((r) => r.date === choice.date)
  const named = day.filter((r) => plainName(r.name) === plainName(choice.name))
  return { row: named.length === 1 ? named[0] : null, sameDay: day.length }
}

// Recent things to wrap up: tracker events with their calendar entries matched
// by date, then calendar entries the tracker doesn't have. Newest first.
// A calendar entry's notes without the lines the app writes itself on an
// event's entry (functions/calendarSync.js: the day's timeline, type, guests,
// contact and link). Those help on the day, not at wrap-up; anything you typed
// into the entry stays.
const APP_LINES = [
  /^Booked\.$/,
  /^Tentative: quoted, not booked yet\.$/,
  /^Leave by /,
  /^Set up from /,
  /^SERVICE /,
  /^Pack up until /,
  /^Home about /,
  /^No service time yet/,
  /^Type: /,
  /^Guests: \d+$/,
  /^Add-ons: /,
  /^Open in Events: /,
]
export const yourNotes = (text, event = null) => {
  const name = String((event && event.name) || '').trim()
  return String(text || '')
    .split('\n')
    .filter((line) => {
      const l = line.trim()
      if (APP_LINES.some((re) => re.test(l))) return false
      // The "Name · phone" line.
      return !(name && (l === name || l.startsWith(`${name} · `)))
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

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
        notes: [e.notes, ...cal.map((c) => yourNotes(c.notes, e))].filter(Boolean),
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
        notes: yourNotes(c.notes) ? [yourNotes(c.notes)] : [],
        calendarTitles: [],
      })
    )
  return out.sort((a, b) => b.date.localeCompare(a.date))
}
