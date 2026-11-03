import { buildLines, DEFAULT_PRICING, newQuote, pickPackage, quoteText, totals, travelText, travelZones } from './quote'
import { addDays, doughDates, mixLeadFrom, placeCandidates, weatherFlags } from './schedule'

describe('quote', () => {
  test('picks the wedding package by event type, else the catch-all', () => {
    expect(pickPackage(DEFAULT_PRICING, 'Wedding + Salad').key).toBe('wedding')
    expect(pickPackage(DEFAULT_PRICING, 'Birthday or family party').key).toBe('party')
  })

  test('wedding of 120 with salad and pasta', () => {
    const { lines, warnings } = buildLines(
      { eventType: 'Wedding', guests: 120, addOns: ['Salad', 'Pasta'] },
      DEFAULT_PRICING
    )
    expect(lines).toEqual([
      { label: 'Wedding package (up to 100 guests)', qty: 1, price: 1500 },
      { label: 'Additional guests', qty: 20, price: 15 },
      { label: 'Salad (per person)', qty: 120, price: 3 },
      { label: 'Pasta (per person)', qty: 120, price: 5 },
    ])
    expect(warnings).toEqual([])
    expect(totals({ lines }).total).toBe(1500 + 300 + 360 + 600)
  })

  test('flags add-ons without a price and a missing guest count', () => {
    const { lines, warnings } = buildLines({ eventType: 'Wedding', addOns: ['Dessert'] }, DEFAULT_PRICING)
    expect(lines).toHaveLength(1)
    expect(warnings.join(' ')).toMatch(/guest count/)
    expect(warnings.join(' ')).toMatch(/Dessert/)
  })

  test('discount, tax and deposit', () => {
    const t = totals({ lines: [{ qty: 1, price: 1000 }], discount: 100, taxRate: 7.25, depositPct: 25 })
    expect(t).toEqual({ subtotal: 1000, discount: 100, tax: 65.25, total: 965.25, deposit: 241.31, balance: 723.94 })
  })

  test('travel by zone', () => {
    const at = (miles) => buildLines({ eventType: 'Wedding', guests: 80, miles }, DEFAULT_PRICING)
    expect(at(20).lines.some((l) => l.label.startsWith('Travel'))).toBe(false)
    expect(at(40).lines[at(40).lines.length - 1]).toEqual({ label: 'Travel (25–50 mi)', qty: 1, price: 50 })
    expect(at(75).lines[at(75).lines.length - 1]).toEqual({ label: 'Travel (50–75 mi)', qty: 1, price: 100 })
    expect(at(90).warnings.join(' ')).toMatch(/past your last travel zone/)
  })

  test('travel text and old per-mile settings', () => {
    expect(travelText(travelZones(DEFAULT_PRICING))).toBe('Free within 25 miles · $50 up to 50 miles · $100 up to 75 miles')
    expect(travelZones({ travel: { freeMiles: 20, perMile: 2 } })).toEqual(DEFAULT_PRICING.travel.zones)
  })

  test('party: minimum as the package, then per guest', () => {
    const { lines } = buildLines({ eventType: 'Birthday or family party', guests: 40 }, DEFAULT_PRICING)
    expect(totals({ lines }).total).toBe(375 + 15 * 15)
  })

  test('quote text has the total', () => {
    const event = { name: 'Sam', eventType: 'Wedding', date: '2027-06-12', guests: 100 }
    const { quote } = newQuote(event, DEFAULT_PRICING)
    expect(quoteText(event, quote)).toMatch(/Total: \$1,500\.00/)
  })
})

describe('schedule', () => {
  test('dough dates count back from the event', () => {
    expect(doughDates('2026-11-14')).toEqual({ poolish: '2026-11-11', mix: '2026-11-12' })
    expect(doughDates('2026-11-14', 1)).toEqual({ poolish: '2026-11-12', mix: '2026-11-13' })
    expect(mixLeadFrom({ settings: [{ setting: 'Mix days before service', value: 1 }] })).toBe(1)
    expect(mixLeadFrom(null)).toBe(2)
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
    expect(doughDates('')).toBeNull()
  })

  test('place candidates drop street, state and zip', () => {
    expect(placeCandidates('123 Main St, Bountiful, UT 84010')).toEqual(['123 Main St, Bountiful, UT 84010', 'Bountiful'])
  })

  test('weather flags', () => {
    expect(weatherFlags({ low: 38, high: 50, rainChance: 60, wind: 5 })).toHaveLength(2)
  })
})

describe('wrap-up choices', () => {
  const { buildChoices } = require('./choices')
  test('tracker events pick up calendar notes on the same date; leftovers come from the calendar', () => {
    const events = [{ id: 'a', name: 'Bella and Tyler', eventType: 'Wedding', date: '2026-10-09', notes: '', guests: 150 }]
    const calendar = [
      { id: 'c1', title: 'Bella wedding', date: '2026-10-09', notes: 'Gate code 1234' },
      { id: 'c2', title: 'Pizza Friday', date: '2026-10-30', notes: 'Rainy, bring tarp' },
      { id: 'c3', title: 'Pizza Friday', date: '2026-11-06', notes: '' },
    ]
    const out = buildChoices(events, calendar, '2026-11-01')
    expect(out.map((c) => c.key)).toEqual(['c:c2', 'e:a'])
    expect(out[0].name).toBe('Pizza Friday')
    expect(out[1].notes).toEqual(['Gate code 1234'])
  })
})
