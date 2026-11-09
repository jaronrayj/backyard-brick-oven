import { ago, changeEntries, followUpDue, followUpMessage, lastContactAt, timeline } from './history'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 10, 9, 18)

test('timeline adds an Added line for events from before history', () => {
  const t = timeline({ source: 'website', createdAt: { toMillis: () => NOW - 3 * DAY } })
  expect(t).toHaveLength(1)
  expect(t[0].text).toMatch(/website/)
})

test('timeline sorts oldest first', () => {
  const t = timeline({ history: [{ at: NOW, type: 'note', text: 'b' }, { at: NOW - DAY, type: 'created', text: 'a' }] })
  expect(t.map((h) => h.text)).toEqual(['a', 'b'])
})

test('last contact ignores stage changes and notes', () => {
  const e = { history: [{ at: NOW - 6 * DAY, type: 'quote-sent', text: 'Sent' }, { at: NOW - DAY, type: 'note', text: 'n' }] }
  expect(lastContactAt(e)).toBe(NOW - 6 * DAY)
})

test('quoted events are due after 5 quiet days, booked never', () => {
  const history = [{ at: NOW - 6 * DAY, type: 'quote-sent', text: 'Sent' }]
  expect(followUpDue({ status: 'quoted', history }, NOW)).toEqual({ days: 6 })
  expect(followUpDue({ status: 'quoted', history: [{ at: NOW - 2 * DAY, type: 'contact', text: 'x' }] }, NOW)).toBeNull()
  expect(followUpDue({ status: 'booked', history }, NOW)).toBeNull()
})

test('follow-up asks for what is missing on an inquiry', () => {
  const m = followUpMessage({ status: 'inquiry', name: 'Becca Jenkins', eventType: 'Wedding', location: 'Kaysville' })
  expect(m.body).toMatch(/^Hi Becca,/)
  expect(m.body).toMatch(/the date and about how many guests/)
})

test('follow-up on a quote names the total and deposit', () => {
  const quote = { lines: [{ label: 'Pizza', qty: 1, price: 2000 }], discount: 0, taxRate: 0, depositPct: 25 }
  const m = followUpMessage({ status: 'quoted', name: 'Jess and Austin', eventType: 'Wedding', date: '2027-04-17', quote })
  expect(m.body).toMatch(/\$2,000\.00/)
  expect(m.body).toMatch(/\$500\.00 deposit/)
})

test('save logs a new quote and a date change', () => {
  const quote = { lines: [{ label: 'Pizza', qty: 1, price: 1500 }] }
  const lines = changeEntries({ id: 'x', date: '' }, { date: '2027-05-18', quote }, NOW)
  expect(lines.map((l) => l.text)).toEqual(['Quote written: $1,500.00', expect.stringMatching(/^Date set to/)])
})

test('ago reads naturally', () => {
  expect(ago(NOW - 3 * DAY, NOW)).toBe('3 days ago')
  expect(ago(NOW - DAY, NOW)).toBe('yesterday')
})
