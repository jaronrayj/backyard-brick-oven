// Quote math for the event tracker. Pure functions, no Firebase, so they can be
// unit tested (quote.test.js) and reused.
//
// Pricing lives in Firestore `eventSettings/pricing` and is edited on the
// Events page. Until that document exists, DEFAULT_PRICING is used.

export const STATUSES = [
  { key: 'inquiry', label: 'Inquiry' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'booked', label: 'Booked' },
  { key: 'done', label: 'Done' },
  { key: 'lost', label: 'Lost' },
]

// Starting numbers only; change them on the page under "Pricing".
// Wedding: $1,500 covers about 100 guests. Extra guests default to the same
// per-head rate ($15). Add-ons with no price are skipped and flagged.
export const DEFAULT_PRICING = {
  packages: [
    { key: 'wedding', name: 'Wedding', match: 'wedding', basePrice: 1500, includedGuests: 100, extraGuestPrice: 15 },
    { key: 'party', name: 'Party / event', match: '', basePrice: 1500, includedGuests: 100, extraGuestPrice: 15 },
  ],
  addOns: [
    { name: 'Salad', perPerson: 3 },
    { name: 'Pasta', perPerson: 5 },
    { name: 'Dessert', perPerson: 0 },
    { name: 'Charcuterie board', perPerson: 0 },
  ],
  // Travel by zone, one-way miles from Bountiful. Past the last zone, quote it by hand.
  travel: {
    zones: [
      { upTo: 25, fee: 0 },
      { upTo: 50, fee: 50 },
      { upTo: 75, fee: 100 },
    ],
  },
  taxRate: 0, // percent, e.g. 7.25
  depositPct: 0, // percent of total due to book
  footer: 'Includes setup, continuous service and cleanup. Date is held once the deposit is paid.',
}

const n = (v) => {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

export const money = (v) =>
  `$${n(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// Pick the package whose `match` text appears in the event type, else the
// last package (the catch-all).
export const pickPackage = (pricing, eventType) => {
  const pkgs = (pricing && pricing.packages) || []
  if (!pkgs.length) return null
  const type = String(eventType || '').toLowerCase()
  return pkgs.find((p) => p.match && type.includes(String(p.match).toLowerCase())) || pkgs[pkgs.length - 1]
}

// Build quote lines from the event and pricing. Returns { lines, warnings }.
// A line is { label, qty, price }; its amount is qty * price.
export const buildLines = (event, pricing) => {
  const lines = []
  const warnings = []
  const guests = Math.max(0, Math.round(n(event.guests)))
  const pkg =
    ((pricing.packages || []).find((p) => p.key === event.packageKey)) || pickPackage(pricing, event.eventType)

  if (!pkg) {
    warnings.push('No packages set up under Pricing.')
  } else {
    const included = Math.max(0, n(pkg.includedGuests))
    lines.push({
      label: included ? `${pkg.name} package (up to ${included} guests)` : `${pkg.name} package`,
      qty: 1,
      price: n(pkg.basePrice),
    })
    const extra = guests - included
    if (included && extra > 0) {
      if (n(pkg.extraGuestPrice) > 0) {
        lines.push({ label: 'Additional guests', qty: extra, price: n(pkg.extraGuestPrice) })
      } else {
        warnings.push(`${extra} guests over the package, but no extra-guest price is set.`)
      }
    }
  }

  if (!guests) warnings.push('No guest count yet, so per-person add-ons are left out.')

  for (const name of event.addOns || []) {
    const addOn = (pricing.addOns || []).find((a) => a.name.toLowerCase() === String(name).toLowerCase())
    if (!addOn || n(addOn.perPerson) <= 0) {
      warnings.push(`${name}: no per-person price set under Pricing.`)
    } else if (guests) {
      lines.push({ label: `${addOn.name} (per person)`, qty: guests, price: n(addOn.perPerson) })
    }
  }

  const miles = n(event.miles)
  if (miles > 0) {
    const zones = travelZones(pricing)
    const i = zones.findIndex((z) => miles <= z.upTo)
    if (i < 0) {
      if (zones.length) warnings.push(`${miles} mi is past your last travel zone (${zones[zones.length - 1].upTo} mi). Add travel by hand.`)
    } else if (zones[i].fee > 0) {
      lines.push({ label: `Travel (${i ? zones[i - 1].upTo : 0}–${zones[i].upTo} mi)`, qty: 1, price: zones[i].fee })
    }
  }

  return { lines, warnings }
}

// Travel zones sorted by distance. Old per-mile settings fall back to the default zones.
export const travelZones = (pricing) => {
  const zones = (pricing && pricing.travel && pricing.travel.zones) || DEFAULT_PRICING.travel.zones
  return zones
    .map((z) => ({ upTo: n(z.upTo), fee: n(z.fee) }))
    .filter((z) => z.upTo > 0)
    .sort((a, b) => a.upTo - b.upTo)
}

// "Free within 25 miles · $50 up to 50 miles · $100 up to 75 miles"
export const travelText = (zones) =>
  zones
    .map((z, i) => (z.fee > 0 ? `$${z.fee.toLocaleString('en-US')} up to ${z.upTo} miles` : i === 0 ? `Free within ${z.upTo} miles` : `Free up to ${z.upTo} miles`))
    .join(' · ')

// What the public website shows, copied to Firestore `publicSettings/site`
// whenever pricing is saved (eventSettings itself is admin-only).
export const publicPricing = (pricing) => {
  const pkg = (key) => {
    const p = (pricing.packages || []).find((x) => x.key === key)
    return p ? { name: p.name, basePrice: n(p.basePrice), includedGuests: n(p.includedGuests), extraGuestPrice: n(p.extraGuestPrice) } : null
  }
  const addOnPrices = (pricing.addOns || []).map((a) => n(a.perPerson)).filter((v) => v > 0)
  return {
    wedding: pkg('wedding'),
    party: pkg('party'),
    addOnRange: addOnPrices.length ? [Math.min(...addOnPrices), Math.max(...addOnPrices)] : null,
    travelZones: travelZones(pricing),
  }
}

const round2 = (v) => Math.round(v * 100) / 100

// Totals for a quote: { lines, discount, taxRate, depositPct }.
export const totals = (quote) => {
  const q = quote || {}
  const subtotal = round2((q.lines || []).reduce((sum, l) => sum + n(l.qty) * n(l.price), 0))
  const discount = round2(Math.min(Math.max(0, n(q.discount)), subtotal))
  const taxable = subtotal - discount
  const tax = round2((taxable * n(q.taxRate)) / 100)
  const total = round2(taxable + tax)
  const deposit = round2((total * n(q.depositPct)) / 100)
  return { subtotal, discount, tax, total, deposit, balance: round2(total - deposit) }
}

// A fresh quote for an event, using the current pricing.
export const newQuote = (event, pricing) => {
  const { lines, warnings } = buildLines(event, pricing)
  return {
    quote: {
      lines,
      discount: 0,
      taxRate: n(pricing.taxRate),
      depositPct: n(pricing.depositPct),
      footer: pricing.footer || '',
    },
    warnings,
  }
}

// "Saturday, June 13, 2026" from "2026-06-13"; anything else is returned as is.
export const prettyDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''))
  if (!m) return String(iso || '')
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

// Plain-text quote to paste into an email or text message.
export const quoteText = (event, quote) => {
  const t = totals(quote)
  const out = []
  out.push(`Backyard Brick Oven — quote for ${event.name || 'your event'}`)
  const what = [event.eventType, prettyDate(event.date), event.time].filter(Boolean).join(' · ')
  if (what) out.push(what)
  if (event.location) out.push(event.location)
  if (n(event.guests)) out.push(`${n(event.guests)} guests`)
  out.push('')
  for (const l of quote.lines || []) {
    const qty = n(l.qty)
    const detail = qty === 1 ? '' : ` (${qty} × ${money(l.price)})`
    out.push(`${l.label}${detail}: ${money(qty * n(l.price))}`)
  }
  out.push('')
  if (t.discount) out.push(`Subtotal: ${money(t.subtotal)}`, `Discount: −${money(t.discount)}`)
  if (t.tax) out.push(`Tax (${n(quote.taxRate)}%): ${money(t.tax)}`)
  out.push(`Total: ${money(t.total)}`)
  if (t.deposit) out.push(`Deposit to book (${n(quote.depositPct)}%): ${money(t.deposit)}`, `Balance due: ${money(t.balance)}`)
  if (quote.footer) out.push('', quote.footer)
  return out.join('\n')
}
