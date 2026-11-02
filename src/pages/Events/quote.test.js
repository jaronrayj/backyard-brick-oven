import { buildLines, DEFAULT_PRICING, newQuote, pickPackage, quoteText, totals } from './quote'
import { addDays, doughDates, placeCandidates, weatherFlags } from './schedule'

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

  test('travel beyond the free miles', () => {
    const pricing = { ...DEFAULT_PRICING, travel: { freeMiles: 20, perMile: 2 } }
    const { lines } = buildLines({ eventType: 'Wedding', guests: 80, miles: 35 }, pricing)
    expect(lines[lines.length - 1]).toEqual({ label: 'Travel (15 mi beyond 20)', qty: 15, price: 2 })
  })

  test('quote text has the total', () => {
    const event = { name: 'Sam', eventType: 'Wedding', date: '2027-06-12', guests: 100 }
    const { quote } = newQuote(event, DEFAULT_PRICING)
    expect(quoteText(event, quote)).toMatch(/Total: \$1,500\.00/)
  })
})

describe('schedule', () => {
  test('dough dates count back from the event', () => {
    expect(doughDates('2026-11-14')).toEqual({ poolish: '2026-11-12', mix: '2026-11-13' })
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
