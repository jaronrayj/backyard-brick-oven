// History log and follow-up helpers for the event tracker. Pure functions, no
// Firebase, so they can be unit tested (history.test.js).
//
// Each event can carry `history`: [{ at, type, text }], newest last.
//   at    a Firestore Timestamp, Date, or millisecond number
//   type  'created' | 'stage' | 'quote' | 'contact' | 'followup' | 'note' | 'change'
//   text  what happened, in plain words
// Older events have no history, so the timeline falls back to createdAt.

import { money, prettyDate, totals } from './quote'

const DAY = 24 * 60 * 60 * 1000

// Firestore Timestamp, Date, number or ISO string → milliseconds (or null).
export const toMillis = (at) => {
  if (at == null) return null
  if (typeof at === 'number') return at
  if (typeof at.toMillis === 'function') return at.toMillis()
  if (at instanceof Date) return at.getTime()
  if (typeof at.seconds === 'number') return at.seconds * 1000
  const ms = Date.parse(at)
  return Number.isNaN(ms) ? null : ms
}

export const entry = (type, text, at = Date.now()) => ({ at, type, text })

// Timeline for display, oldest first. Adds an "Added" line from createdAt when
// the event predates history.
export const timeline = (event) => {
  const list = (event.history || []).filter((h) => toMillis(h.at) != null)
  if (!list.some((h) => h.type === 'created') && toMillis(event.createdAt) != null) {
    const from = event.source === 'website' ? 'Inquiry came in from the website' : 'Added to the tracker'
    list.push(entry('created', from, event.createdAt))
  }
  return list.sort((a, b) => toMillis(a.at) - toMillis(b.at))
}

// What moments count as reaching out (or hearing from) the customer.
const CONTACT_TYPES = ['created', 'contact', 'followup', 'quote-sent']

export const lastContactAt = (event) => {
  const times = timeline(event)
    .filter((h) => CONTACT_TYPES.includes(h.type))
    .map((h) => toMillis(h.at))
  return times.length ? Math.max(...times) : null
}

export const daysSince = (at, now = Date.now()) => {
  const ms = toMillis(at)
  return ms == null ? null : Math.floor((now - ms) / DAY)
}

// "today", "yesterday", "5 days ago", or "Nov 3" past two weeks.
export const ago = (at, now = Date.now()) => {
  const ms = toMillis(at)
  if (ms == null) return ''
  const d = daysSince(ms, now)
  if (d <= 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 14) return `${d} days ago`
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d > 300 ? 'numeric' : undefined })
}

export const stamp = (at) => {
  const ms = toMillis(at)
  if (ms == null) return ''
  return new Date(ms).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// How long to wait before nudging, by stage.
export const FOLLOW_UP_DAYS = { inquiry: 2, quoted: 5 }

// Is this event due a follow-up? Only inquiries and quotes wait on the customer.
export const followUpDue = (event, now = Date.now()) => {
  const wait = FOLLOW_UP_DAYS[event.status]
  if (wait == null) return null
  const d = daysSince(lastContactAt(event), now)
  if (d == null || d < wait) return null
  return { days: d }
}

const firstName = (name) => String(name || '').trim().split(/\s+|&/)[0] || 'there'

// A short follow-up message in Jaron's voice, by stage and what's missing.
export const followUpMessage = (event) => {
  const hi = `Hi ${firstName(event.name)},`
  const sign = 'Thanks!\nJaron\nBackyard Brick Oven · (801) 872-3439'
  const when = event.date ? ` on ${prettyDate(event.date)}` : ''
  const what = event.eventType ? event.eventType.toLowerCase() : 'event'
  const missing = []
  if (!event.date) missing.push('the date')
  if (!event.guests) missing.push('about how many guests')
  if (!event.location) missing.push('where it is')

  if (event.status === 'quoted' && event.quote) {
    const t = totals(event.quote)
    const deposit = t.deposit ? ` A ${money(t.deposit)} deposit holds the date.` : ''
    return {
      subject: `Following up on your pizza quote${when}`,
      body: `${hi}\n\nJust checking in on the quote I sent for your ${what}${when} (${money(t.total)}).${deposit} Happy to adjust anything, or answer any questions.\n\n${sign}`,
    }
  }
  if (missing.length) {
    const list = missing.length > 1 ? `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}` : missing[0]
    return {
      subject: 'Pizza for your event',
      body: `${hi}\n\nThanks for reaching out about pizza for your ${what}! To put a quote together, could you send me ${list}?\n\n${sign}`,
    }
  }
  return {
    subject: `Pizza for your ${what}${when}`,
    body: `${hi}\n\nJust following up on pizza for your ${what}${when}. Do you have any questions I can answer, or would you like me to put a quote together?\n\n${sign}`,
  }
}

export const mailtoLink = (email, { subject, body }) =>
  `mailto:${encodeURIComponent(email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

// Texts use the same body; the subject is dropped.
export const smsLink = (phone, { body }) => `sms:${String(phone || '').replace(/[^\d+]/g, '')}?&body=${encodeURIComponent(body)}`

// History lines for what changed on Save (compared with what was loaded).
export const changeEntries = (before, after, now = Date.now()) => {
  const out = []
  if (!before.id && !before.createdAt) {
    out.push(entry('created', 'Added to the tracker', now))
  }
  const total = (e) => (e.quote ? totals(e.quote).total : null)
  const was = total(before)
  const is = total(after)
  if (is != null && was == null) out.push(entry('quote', `Quote written: ${money(is)}`, now))
  else if (is != null && was != null && Math.abs(is - was) >= 0.005) out.push(entry('quote', `Quote changed: ${money(was)} → ${money(is)}`, now))
  else if (is == null && was != null) out.push(entry('quote', 'Quote removed', now))
  if (before.id || before.createdAt) {
    if ((before.date || '') !== (after.date || '')) {
      out.push(entry('change', after.date ? `Date set to ${prettyDate(after.date)}` : 'Date cleared', now))
    }
    if (String(before.guests || '') !== String(after.guests || '') && after.guests) {
      out.push(entry('change', `Guests: ${before.guests || '?'} → ${after.guests}`, now))
    }
  }
  return out
}
