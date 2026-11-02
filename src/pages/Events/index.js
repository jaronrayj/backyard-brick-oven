import React, { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db, signInWithGoogle } from '../../utils/firebase'
import useEventAdmin from './useEventAdmin'
import { PageHeader, TeamPage, ui } from '../../components/TeamPage'
import { DEFAULT_PRICING, STATUSES, money, newQuote, prettyDate, quoteText, totals } from './quote'
import {
  DEFAULT_REMINDERS,
  FORECAST_DAYS,
  daysUntil,
  doughDates,
  mixLeadFrom,
  forecast,
  geocode,
  todayISO,
  weatherFlags,
  weatherLine,
} from './schedule'

// Event tracker: inquiries, quotes and bookings.
//   events/{id}               one event (website inquiries land here too, status "inquiry")
//   eventSettings/pricing     packages, add-ons, travel, tax, deposit, quote footer
//   eventSettings/reminders   dough reminder lead days and who gets the emails
// Admins only: emails in `plannerAccess/team` admins (the Firestore rules enforce it).
// See docs/events.md.

const ADD_ONS = ['Salad', 'Pasta', 'Dessert', 'Charcuterie board']
const EVENT_TYPES = [
  'Wedding',
  'Birthday or family party',
  'Holiday party',
  'Corporate or work event',
  'Bridal shower or bachelorette',
  'Pizza class',
  'Pizza Friday / service',
  'Other',
]

const { input, btnPrimary, btnQuiet } = ui

const statusLabel = (key) => (STATUSES.find((s) => s.key === key) || { label: key }).label
const STATUS_COLORS = {
  inquiry: 'bg-sky-100 text-sky-800',
  quoted: 'bg-amber-100 text-amber-800',
  booked: 'bg-green-100 text-green-800',
  done: 'bg-gray-200 text-gray-700',
  lost: 'bg-red-100 text-red-700',
}

const Field = ({ label, children, className = '' }) => (
  <label className={`block text-left text-xs text-gray-600 ${className}`}>
    <span className="block mb-1">{label}</span>
    {children}
  </label>
)

// Forecast for an event that has a saved location point. Loads only inside the
// forecast window; outside it, says when it will appear.
const useForecast = (event) => {
  const [state, setState] = useState({ loading: false, weather: null, error: '' })
  const geo = event.geo
  const days = daysUntil(event.date)
  const inWindow = days != null && days >= 0 && days < FORECAST_DAYS
  const lat = geo && geo.lat
  const lon = geo && geo.lon
  useEffect(() => {
    if (!inWindow || lat == null) {
      setState({ loading: false, weather: null, error: '' })
      return undefined
    }
    let cancelled = false
    setState({ loading: true, weather: null, error: '' })
    forecast({ lat, lon }, event.date)
      .then((weather) => !cancelled && setState({ loading: false, weather, error: '' }))
      .catch(() => !cancelled && setState({ loading: false, weather: null, error: "Couldn't load the forecast." }))
    return () => {
      cancelled = true
    }
  }, [inWindow, lat, lon, event.date])
  return { ...state, days, inWindow }
}

const WeatherNote = ({ event, compact }) => {
  const { loading, weather, error, days, inWindow } = useForecast(event)
  if (days == null || days < 0) return null
  if (!event.geo) {
    return compact ? null : <p className="text-sm text-gray-500">Add a location (a town is enough) to get the forecast.</p>
  }
  if (!inWindow) {
    return compact ? null : (
      <p className="text-sm text-gray-500">
        Forecast shows up {days - FORECAST_DAYS + 1} days from now (16 days before the event).
      </p>
    )
  }
  if (loading) return <p className="text-sm text-gray-500">{compact ? '…' : 'Loading forecast…'}</p>
  if (error) return <p className="text-sm text-red-700">{error}</p>
  if (!weather) return null
  const flags = weatherFlags(weather)
  return (
    <div className="text-sm">
      <p className="text-gray-800">
        {compact ? '' : `${event.geo.label}: `}
        {weatherLine(weather)}
      </p>
      {flags.length > 0 && <p className="text-amber-800 font-medium">{flags.join(' · ')}</p>}
    </div>
  )
}

const DoughNote = ({ event, mixLead }) => {
  const dates = doughDates(event.date, mixLead)
  if (!dates || event.status !== 'booked') return null
  const today = todayISO()
  const tag = (d) => (d === today ? ' (today)' : daysUntil(d) === 1 ? ' (tomorrow)' : '')
  return (
    <p className="text-sm text-gray-700">
      Poolish: {prettyDate(dates.poolish)}
      {tag(dates.poolish)} · Mix: {prettyDate(dates.mix)}
      {tag(dates.mix)}
    </p>
  )
}

// ---------- Quote ----------

const printQuote = (event, quote) => {
  const t = totals(quote)
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  const rows = (quote.lines || [])
    .map(
      (l) =>
        `<tr><td>${esc(l.label)}</td><td class="r">${Number(l.qty) || 0}</td><td class="r">${money(l.price)}</td><td class="r">${money(
          (Number(l.qty) || 0) * (Number(l.price) || 0)
        )}</td></tr>`
    )
    .join('')
  const sum = (label, value) => `<tr class="sum"><td colspan="3">${label}</td><td class="r">${value}</td></tr>`
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Quote — ${esc(event.name)}</title>
<style>body{font-family:Georgia,serif;max-width:680px;margin:40px auto;padding:0 20px;color:#222}
h1{font-size:24px;margin:0}p{margin:4px 0}table{width:100%;border-collapse:collapse;margin:24px 0}
td,th{padding:8px 4px;border-bottom:1px solid #ddd;text-align:left}.r{text-align:right}
.sum td{border:none;padding:4px}.total td{font-weight:bold;font-size:18px;border-top:2px solid #222}
.muted{color:#666;font-size:14px}</style></head><body>
<h1>Backyard Brick Oven</h1><p class="muted">backyardbrickovenpizza.com · (801) 872-3439</p>
<h2>Quote for ${esc(event.name)}</h2>
<p>${esc([event.eventType, prettyDate(event.date), event.time].filter(Boolean).join(' · '))}</p>
${event.location ? `<p>${esc(event.location)}</p>` : ''}${event.guests ? `<p>${esc(event.guests)} guests</p>` : ''}
<table><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr>${rows}
${t.discount ? sum('Subtotal', money(t.subtotal)) + sum('Discount', `−${money(t.discount)}`) : ''}
${t.tax ? sum(`Tax (${quote.taxRate}%)`, money(t.tax)) : ''}
<tr class="sum total"><td colspan="3">Total</td><td class="r">${money(t.total)}</td></tr>
${t.deposit ? sum(`Deposit to book (${quote.depositPct}%)`, money(t.deposit)) + sum('Balance due', money(t.balance)) : ''}
</table>${quote.footer ? `<p class="muted">${esc(quote.footer)}</p>` : ''}
<p class="muted">Quoted ${prettyDate(todayISO())}</p></body></html>`
  const w = window.open('', '_blank')
  if (!w) {
    window.alert('Allow pop-ups for this site to print the quote.')
    return
  }
  w.document.write(html)
  w.document.close()
  w.focus()
  w.print()
}

const QuoteEditor = ({ event, pricing, onChange }) => {
  const [warnings, setWarnings] = useState([])
  const [copied, setCopied] = useState(false)
  const quote = event.quote

  const rebuild = () => {
    const fresh = newQuote(event, pricing)
    setWarnings(fresh.warnings)
    onChange(fresh.quote)
  }

  if (!quote) {
    return (
      <div className="space-y-2">
        <button type="button" className={btnPrimary} onClick={rebuild}>
          Build quote from pricing
        </button>
      </div>
    )
  }

  const t = totals(quote)
  const setLine = (i, patch) => onChange({ ...quote, lines: quote.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) })
  const removeLine = (i) => onChange({ ...quote, lines: quote.lines.filter((_, j) => j !== i) })
  const addLine = () => onChange({ ...quote, lines: [...quote.lines, { label: '', qty: 1, price: 0 }] })
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(quoteText(event, quote))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      window.alert("Couldn't copy. Use Print instead.")
    }
  }

  return (
    <div className="space-y-3">
      {warnings.length > 0 && (
        <ul className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2 list-disc pl-6 text-left">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
      <div className="space-y-2">
        <div className="hidden sm:grid grid-cols-[1fr_70px_90px_90px_28px] gap-2 text-xs text-gray-500 text-left">
          <span>Item</span>
          <span>Qty</span>
          <span>Price</span>
          <span className="text-right">Amount</span>
          <span />
        </div>
        {quote.lines.map((l, i) => (
          <div key={i} className="grid grid-cols-[1fr_70px_90px_90px_28px] gap-2 items-center">
            <input className={input} value={l.label} placeholder="Item" onChange={(e) => setLine(i, { label: e.target.value })} />
            <input className={input} type="number" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} />
            <input className={input} type="number" step="0.01" value={l.price} onChange={(e) => setLine(i, { price: e.target.value })} />
            <span className="text-right text-sm">{money((Number(l.qty) || 0) * (Number(l.price) || 0))}</span>
            <button type="button" aria-label="Remove line" className="text-gray-400 hover:text-red-700" onClick={() => removeLine(i)}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" className={btnQuiet} onClick={addLine}>
          + Line
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Field label="Discount ($)">
          <input className={input} type="number" value={quote.discount} onChange={(e) => onChange({ ...quote, discount: e.target.value })} />
        </Field>
        <Field label="Tax (%)">
          <input className={input} type="number" step="0.01" value={quote.taxRate} onChange={(e) => onChange({ ...quote, taxRate: e.target.value })} />
        </Field>
        <Field label="Deposit (%)">
          <input className={input} type="number" value={quote.depositPct} onChange={(e) => onChange({ ...quote, depositPct: e.target.value })} />
        </Field>
      </div>
      <Field label="Note at the bottom of the quote">
        <textarea className={input} rows={2} value={quote.footer || ''} onChange={(e) => onChange({ ...quote, footer: e.target.value })} />
      </Field>

      <div className="text-right text-sm space-y-0.5">
        {t.discount > 0 && <p>Subtotal {money(t.subtotal)} · Discount −{money(t.discount)}</p>}
        {t.tax > 0 && <p>Tax {money(t.tax)}</p>}
        <p className="text-lg font-bold">Total {money(t.total)}</p>
        {t.deposit > 0 && (
          <p>
            Deposit {money(t.deposit)} · Balance {money(t.balance)}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        <button type="button" className={btnQuiet} onClick={rebuild}>
          Rebuild from pricing
        </button>
        <button type="button" className={btnQuiet} onClick={copy}>
          {copied ? 'Copied' : 'Copy as text'}
        </button>
        <button type="button" className={btnQuiet} onClick={() => printQuote(event, quote)}>
          Print / PDF
        </button>
      </div>
    </div>
  )
}

// ---------- Event editor ----------

const blankEvent = () => ({
  status: 'inquiry',
  name: '',
  email: '',
  phone: '',
  eventType: '',
  eventFor: '',
  date: '',
  time: '',
  location: '',
  guests: '',
  miles: '',
  addOns: [],
  heardAbout: '',
  comments: '',
  notes: '',
  quote: null,
  source: 'manual',
})

const EventEditor = ({ id, initial, pricing, mixLead, onClose }) => {
  const [event, setEvent] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = (patch) => setEvent((e) => ({ ...e, ...patch }))

  const toggleAddOn = (name) =>
    set({ addOns: event.addOns.includes(name) ? event.addOns.filter((a) => a !== name) : [...event.addOns, name] })

  const save = async () => {
    if (!event.name.trim()) {
      setError('Add a name first.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const fields = { ...event }
      delete fields.id
      const numOr = (v) => (v === '' || v == null ? '' : Number(v))
      let data = {
        ...fields,
        guests: numOr(event.guests),
        miles: numOr(event.miles),
        quote: event.quote
          ? {
              ...event.quote,
              lines: event.quote.lines.map((l) => ({ label: l.label, qty: Number(l.qty) || 0, price: Number(l.price) || 0 })),
              discount: Number(event.quote.discount) || 0,
              taxRate: Number(event.quote.taxRate) || 0,
              depositPct: Number(event.quote.depositPct) || 0,
            }
          : null,
        updatedAt: serverTimestamp(),
      }
      // Look up the forecast point when the location is new or changed.
      if (data.location && (!data.geo || data.geo.from !== data.location)) {
        const geo = await geocode(data.location).catch(() => null)
        data.geo = geo ? { ...geo, from: data.location } : null
      }
      if (!data.location) data.geo = null
      if (data.quote && event.status === 'inquiry' && initial.status === 'inquiry' && !initial.quote) {
        data.status = 'quoted'
      }
      if (id) {
        await updateDoc(doc(db, 'events', id), data)
      } else {
        data = { ...data, createdAt: serverTimestamp() }
        await addDoc(collection(db, 'events'), data)
      }
      onClose()
    } catch (e) {
      console.error(e)
      setError("Couldn't save. Check you're signed in as an admin.")
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await deleteDoc(doc(db, 'events', id))
      onClose()
    } catch (e) {
      setError("Couldn't delete.")
      setBusy(false)
    }
  }

  return (
    <div className={`${ui.card} sm:p-6 space-y-5`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xl font-bold">{id ? event.name || 'Event' : 'New event'}</h2>
        <select className={`${input} w-auto`} value={event.status} onChange={(e) => set({ status: e.target.value })}>
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <section className="grid sm:grid-cols-2 gap-3">
        <Field label="Name">
          <input className={input} value={event.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label="Event type">
          <input className={input} list="event-types" value={event.eventType} onChange={(e) => set({ eventType: e.target.value })} />
          <datalist id="event-types">
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>
        <Field label="Email">
          <input className={input} type="email" value={event.email} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label="Phone">
          <input className={input} type="tel" value={event.phone} onChange={(e) => set({ phone: e.target.value })} />
        </Field>
        <Field label="Date">
          <input className={input} type="date" value={event.date} onChange={(e) => set({ date: e.target.value })} />
        </Field>
        <Field label="Service time">
          <input className={input} value={event.time} placeholder="5–8 pm" onChange={(e) => set({ time: e.target.value })} />
        </Field>
        <Field label="Location (a town is enough for weather)" className="sm:col-span-2">
          <input className={input} value={event.location} onChange={(e) => set({ location: e.target.value })} />
        </Field>
        <Field label="Guests">
          <input className={input} type="number" value={event.guests} onChange={(e) => set({ guests: e.target.value })} />
        </Field>
        <Field label="Miles from the kitchen (for travel)">
          <input className={input} type="number" value={event.miles} onChange={(e) => set({ miles: e.target.value })} />
        </Field>
      </section>

      <section>
        <p className="text-xs text-gray-600 mb-1">Add-ons</p>
        <div className="flex flex-wrap gap-2">
          {ADD_ONS.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={event.addOns.includes(a)}
              onClick={() => toggleAddOn(a)}
              className={`px-3 py-1 rounded-full text-sm border ${
                event.addOns.includes(a) ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white border-gray-300 text-gray-600'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </section>

      {(event.eventFor || event.heardAbout || event.comments) && (
        <section className="text-sm text-gray-700 bg-gray-50 rounded-md p-3 space-y-1">
          {event.eventFor && <p>For: {event.eventFor}</p>}
          {event.heardAbout && <p>Heard about us: {event.heardAbout}</p>}
          {event.comments && <p className="whitespace-pre-wrap">Their note: {event.comments}</p>}
        </section>
      )}

      <Field label="Your notes">
        <textarea className={input} rows={3} value={event.notes} onChange={(e) => set({ notes: e.target.value })} />
      </Field>

      {event.date && (
        <section className="space-y-1">
          <h3 className="font-semibold">Weather and dough</h3>
          {initial.geo && initial.location === event.location ? (
            <WeatherNote event={event} />
          ) : (
            <p className="text-sm text-gray-500">Save to look up the forecast for this location.</p>
          )}
          <DoughNote event={event} mixLead={mixLead} />
        </section>
      )}

      <section className="space-y-2">
        <h3 className="font-semibold">Quote</h3>
        <QuoteEditor event={event} pricing={pricing} onChange={(quote) => set({ quote })} />
      </section>

      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2 justify-between">
        <div>
          {id &&
            (confirmDelete ? (
              <span className="text-sm">
                Delete this event?{' '}
                <button type="button" className="underline text-red-700" disabled={busy} onClick={remove}>
                  Yes, delete
                </button>{' '}
                <button type="button" className="underline" onClick={() => setConfirmDelete(false)}>
                  No
                </button>
              </span>
            ) : (
              <button type="button" className="text-sm text-gray-500 underline" onClick={() => setConfirmDelete(true)}>
                Delete
              </button>
            ))}
        </div>
        <div className="flex gap-2">
          <button type="button" className={btnQuiet} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} disabled={busy} onClick={save}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- Settings ----------

const Settings = ({ pricing, reminders, mixLead, onClose }) => {
  const [p, setP] = useState(pricing)
  const [r, setR] = useState({ ...reminders, emailsText: (reminders.emails || []).join(', ') })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const setPkg = (i, patch) => setP({ ...p, packages: p.packages.map((x, j) => (j === i ? { ...x, ...patch } : x)) })
  const setAddOn = (i, patch) => setP({ ...p, addOns: p.addOns.map((x, j) => (j === i ? { ...x, ...patch } : x)) })
  const num = (v) => (v === '' ? 0 : Number(v))

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      const clean = {
        ...p,
        packages: p.packages.map((x) => ({
          ...x,
          key: x.key || x.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          basePrice: num(x.basePrice),
          includedGuests: num(x.includedGuests),
          extraGuestPrice: num(x.extraGuestPrice),
        })),
        addOns: p.addOns.map((x) => ({ ...x, perPerson: num(x.perPerson) })),
        travel: { freeMiles: num(p.travel.freeMiles), perMile: num(p.travel.perMile) },
        taxRate: num(p.taxRate),
        depositPct: num(p.depositPct),
      }
      const emails = r.emailsText
        .split(/[\s,]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
      await Promise.all([
        setDoc(doc(db, 'eventSettings', 'pricing'), clean),
        setDoc(doc(db, 'eventSettings', 'reminders'), { emails }),
      ])
      onClose()
    } catch (e) {
      console.error(e)
      setError("Couldn't save the settings.")
      setBusy(false)
    }
  }

  return (
    <div className={`${ui.card} sm:p-6 space-y-5`}>
      <h2 className="text-xl font-bold">Pricing and reminders</h2>

      <section className="space-y-2">
        <h3 className="font-semibold">Packages</h3>
        <p className="text-xs text-gray-500">
          An event gets the first package whose "matches" word is in its event type; otherwise the last package.
        </p>
        {p.packages.map((x, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_1fr_1fr_28px] gap-2 items-end border-b pb-2">
            <Field label="Name">
              <input className={input} value={x.name} onChange={(e) => setPkg(i, { name: e.target.value })} />
            </Field>
            <Field label="Matches">
              <input className={input} value={x.match} onChange={(e) => setPkg(i, { match: e.target.value })} />
            </Field>
            <Field label="Base price">
              <input className={input} type="number" value={x.basePrice} onChange={(e) => setPkg(i, { basePrice: e.target.value })} />
            </Field>
            <Field label="Guests included">
              <input className={input} type="number" value={x.includedGuests} onChange={(e) => setPkg(i, { includedGuests: e.target.value })} />
            </Field>
            <Field label="Each extra guest">
              <input className={input} type="number" value={x.extraGuestPrice} onChange={(e) => setPkg(i, { extraGuestPrice: e.target.value })} />
            </Field>
            {p.packages.length > 1 ? (
              <button
                type="button"
                aria-label={`Remove ${x.name || 'package'}`}
                className="text-gray-400 hover:text-red-700 pb-1.5"
                onClick={() => setP({ ...p, packages: p.packages.filter((_, j) => j !== i) })}
              >
                ✕
              </button>
            ) : (
              <span />
            )}
          </div>
        ))}
        <button
          type="button"
          className={btnQuiet}
          onClick={() =>
            // New packages go above the last one, which stays the catch-all.
            setP({ ...p, packages: [...p.packages.slice(0, -1), { key: '', name: '', match: '', basePrice: 0, includedGuests: 0, extraGuestPrice: 0 }, ...p.packages.slice(-1)] })
          }
        >
          + Package
        </button>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold">Add-ons (per person)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {p.addOns.map((x, i) => (
            <Field key={x.name} label={x.name}>
              <input className={input} type="number" step="0.25" value={x.perPerson} onChange={(e) => setAddOn(i, { perPerson: e.target.value })} />
            </Field>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Field label="Free travel miles">
          <input className={input} type="number" value={p.travel.freeMiles} onChange={(e) => setP({ ...p, travel: { ...p.travel, freeMiles: e.target.value } })} />
        </Field>
        <Field label="$ per mile after">
          <input className={input} type="number" step="0.01" value={p.travel.perMile} onChange={(e) => setP({ ...p, travel: { ...p.travel, perMile: e.target.value } })} />
        </Field>
        <Field label="Sales tax (%)">
          <input className={input} type="number" step="0.01" value={p.taxRate} onChange={(e) => setP({ ...p, taxRate: e.target.value })} />
        </Field>
        <Field label="Deposit (%)">
          <input className={input} type="number" value={p.depositPct} onChange={(e) => setP({ ...p, depositPct: e.target.value })} />
        </Field>
      </section>
      <Field label="Default note at the bottom of quotes">
        <textarea className={input} rows={2} value={p.footer} onChange={(e) => setP({ ...p, footer: e.target.value })} />
      </Field>

      <section className="space-y-2">
        <h3 className="font-semibold">Dough reminders</h3>
        <p className="text-xs text-gray-500">
          For booked events, an email goes out around 2 pm on poolish day and on mix day, with the forecast. Mix day is{' '}
          {mixLead} {mixLead === 1 ? 'day' : 'days'} before the event and poolish the evening before, from the dough planner's
          "mix days before service" setting.
        </p>
        <Field label="Send to (blank = the business inbox)">
          <input className={input} value={r.emailsText} placeholder="you@gmail.com, partner@gmail.com" onChange={(e) => setR({ ...r, emailsText: e.target.value })} />
        </Field>
      </section>

      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" className={btnQuiet} onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={btnPrimary} disabled={busy} onClick={save}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ---------- List ----------

const FILTERS = [
  { key: 'open', label: 'Open', test: (e) => ['inquiry', 'quoted', 'booked'].includes(e.status) },
  ...STATUSES.map((s) => ({ key: s.key, label: s.label, test: (e) => e.status === s.key })),
  { key: 'all', label: 'All', test: () => true },
]

const byDate = (a, b) => String(a.date || '9999').localeCompare(String(b.date || '9999'))

const EventRow = ({ event, mixLead, onOpen }) => {
  const t = event.quote ? totals(event.quote) : null
  const days = daysUntil(event.date)
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-900 p-4 space-y-1"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{event.name || 'Unnamed'}</p>
            <p className="text-sm text-gray-600">
              {[event.eventType, event.guests ? `${event.guests} guests` : ''].filter(Boolean).join(' · ')}
            </p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[event.status] || ''}`}>{statusLabel(event.status)}</span>
        </div>
        <p className="text-sm text-gray-800">
          {event.date ? prettyDate(event.date) : 'No date'}
          {days != null && days >= 0 && days <= 30 ? ` · ${days === 0 ? 'today' : `in ${days} days`}` : ''}
          {event.location ? ` · ${event.location}` : ''}
        </p>
        <WeatherNote event={event} compact />
        <DoughNote event={event} mixLead={mixLead} />
        {t && <p className="text-sm font-medium">Quote {money(t.total)}</p>}
      </button>
    </li>
  )
}

// ---------- Page ----------

const Shell = TeamPage

const Events = () => {
  const { user, loading, access } = useEventAdmin()
  const [events, setEvents] = useState([])
  const [pricing, setPricing] = useState(DEFAULT_PRICING)
  const [reminders, setReminders] = useState(DEFAULT_REMINDERS)
  const [mixLead, setMixLead] = useState(2)
  const [filter, setFilter] = useState('open')
  const [editing, setEditing] = useState(null) // { id, event } | 'settings' | null

  useEffect(() => {
    if (access !== true) return undefined
    const unsubs = [
      onSnapshot(collection(db, 'events'), (snap) => setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(doc(db, 'eventSettings', 'pricing'), (snap) => snap.exists() && setPricing({ ...DEFAULT_PRICING, ...snap.data() })),
      onSnapshot(doc(db, 'planner', 'ref'), (snap) => setMixLead(mixLeadFrom(snap.data())), () => {}),
      onSnapshot(doc(db, 'eventSettings', 'reminders'), (snap) => snap.exists() && setReminders({ ...DEFAULT_REMINDERS, ...snap.data() })),
    ]
    return () => unsubs.forEach((u) => u())
  }, [access])

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.key, events.filter(f.test).length])), [events])
  const shown = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter)
    const list = events.filter(f.test).sort(byDate)
    return ['done', 'lost', 'all'].includes(filter) ? list.reverse() : list
  }, [events, filter])

  if (loading) return <Shell><p className="text-gray-500">Loading…</p></Shell>
  if (!user) {
    return (
      <Shell>
        <PageHeader title="Events" />
        <p className="text-gray-700">Sign in with your Google account.</p>
        <button type="button" className={btnPrimary} onClick={signInWithGoogle}>
          Sign in with Google
        </button>
      </Shell>
    )
  }
  if (access === 'denied') {
    return (
      <Shell>
        <PageHeader title="Events" />
        <p className="text-gray-700">{user.email} isn't an admin. Ask Jaron to add it, then reload this page.</p>
      </Shell>
    )
  }

  if (editing === 'settings') {
    return (
      <Shell>
        <Settings pricing={pricing} reminders={reminders} mixLead={mixLead} onClose={() => setEditing(null)} />
      </Shell>
    )
  }
  if (editing) {
    return (
      <Shell>
        <EventEditor id={editing.id} initial={editing.event} pricing={pricing} mixLead={mixLead} onClose={() => setEditing(null)} />
      </Shell>
    )
  }

  return (
    <Shell>
      <PageHeader title="Events" sub="Inquiries, quotes and bookings">
        <button type="button" className={btnQuiet} onClick={() => setEditing('settings')}>
          Pricing
        </button>
        <button type="button" className={btnPrimary} onClick={() => setEditing({ id: null, event: blankEvent() })}>
          + New event
        </button>
      </PageHeader>

      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-sm border ${
              filter === f.key ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            {f.label} {counts[f.key] ? <span className="opacity-70">{counts[f.key]}</span> : null}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className={`${ui.card} text-gray-500`}>Nothing here yet. Website inquiries show up here on their own.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((e) => (
            <EventRow
              key={e.id}
              event={e}
              mixLead={mixLead}
              onOpen={() => setEditing({ id: e.id, event: { ...blankEvent(), ...e } })}
            />
          ))}
        </ul>
      )}
    </Shell>
  )
}

export default Events
