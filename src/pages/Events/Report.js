import React, { useEffect, useMemo, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../utils/db'
import { EXTRA, FUNNEL } from '../../utils/track'
import { ui } from '../../components/TeamPage'

// Events > Report: visitors on the website (Firestore `siteStats`, counted by
// utils/track.js) and what happened to the inquiries and events added each month.

const MONTHS = 6
const monthKey = (d) => d.toLocaleDateString('en-CA', { timeZone: 'America/Denver' }).slice(0, 7)
const monthName = (key) =>
  new Date(`${key}-15T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })
const lastMonths = () => {
  const out = []
  const d = new Date()
  d.setDate(15)
  for (let i = 0; i < MONTHS; i += 1) {
    out.push(monthKey(d))
    d.setMonth(d.getMonth() - 1)
  }
  return out
}
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '–')
const createdMonth = (e) => {
  const t = e.createdAt
  const d = t && typeof t.toDate === 'function' ? t.toDate() : null
  return d ? monthKey(d) : null
}

// Where the most people stop, from the inquiries page on (needs enough visits to mean anything).
const biggestDrop = (row) => {
  const steps = FUNNEL.slice(1)
  if ((row.inquiries_view || 0) < 20) return null
  let worst = null
  for (let i = 1; i < steps.length; i += 1) {
    const from = row[steps[i - 1].step] || 0
    const to = row[steps[i].step] || 0
    if (!from) continue
    const keep = to / from
    if (!worst || keep < worst.keep) worst = { from: steps[i - 1].label, to: steps[i].label, keep }
  }
  return worst
}

const Table = ({ months, rows, head }) => (
  <div className="overflow-x-auto -mx-4 px-4">
    <table className="w-full text-sm tabular-nums">
      <thead>
        <tr className="text-gray-500">
          <th className="text-left font-medium py-1 pr-3">{head}</th>
          {months.map((m) => (
            <th key={m} className="text-right font-medium py-1 px-2 whitespace-nowrap">
              {monthName(m)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ label, values, sub }) => (
          <tr key={label} className="border-t border-gray-100">
            <td className="py-1.5 pr-3 text-gray-800">
              {label}
              {sub && <span className="block text-xs text-gray-500">{sub}</span>}
            </td>
            {values.map((v, i) => (
              <td key={months[i]} className="text-right py-1.5 px-2">
                {v}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const Report = ({ events, onClose }) => {
  const months = useMemo(lastMonths, [])
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getDocs(collection(db, 'siteStats'))
      .then((snap) => setStats(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))))
      .catch(() => setError("Couldn't load the visitor counts."))
  }, [])

  const visitorRows = useMemo(() => {
    if (!stats) return []
    const row = (m) => stats[m] || {}
    const steps = FUNNEL.map(({ step, label }, i) => ({
      label,
      sub: i > 1 ? `of those who ${FUNNEL[i - 1].label.toLowerCase()}` : null,
      values: months.map((m) => {
        const v = row(m)[step] || 0
        return i > 1 && v ? `${v} · ${pct(v, row(m)[FUNNEL[i - 1].step] || 0)}` : v
      }),
    }))
    const extra = EXTRA.map(({ step, label }) => ({ label, values: months.map((m) => row(m)[step] || 0) }))
    return [...steps, ...extra]
  }, [stats, months])

  const eventRows = useMemo(() => {
    const by = (m, test) => events.filter((e) => createdMonth(e) === m && test(e)).length
    const all = (m) => by(m, () => true)
    const reached = (states) => (e) => states.includes(e.status)
    const share = (m, states) => (all(m) ? `${by(m, reached(states))} · ${pct(by(m, reached(states)), all(m))}` : '–')
    return [
      { label: 'Added', sub: 'website inquiries and events you added', values: months.map(all) },
      { label: 'From the website', values: months.map((m) => by(m, (e) => e.source === 'website')) },
      {
        label: 'Quoted or further',
        values: months.map((m) => share(m, ['quoted', 'booked', 'done'])),
      },
      {
        label: 'Booked',
        sub: 'booked or done',
        values: months.map((m) => share(m, ['booked', 'done'])),
      },
      { label: 'Lost', values: months.map((m) => by(m, reached(['lost']))) },
    ]
  }, [events, months])

  const drop = stats ? biggestDrop(stats[months[0]] || {}) || biggestDrop(stats[months[1]] || {}) : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Report</h2>
        <button type="button" className={ui.btnQuiet} onClick={onClose}>
          Back to events
        </button>
      </div>

      <section className={`${ui.card} space-y-3`}>
        <div>
          <h3 className="font-semibold text-gray-900">Website visitors</h3>
          <p className="text-xs text-gray-500">
            People, not page loads: each step counts once per visit. Your own browsers are left out once you've signed in to a team page.
          </p>
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {!stats && !error && <p className="text-sm text-gray-500">Loading…</p>}
        {stats && <Table months={months} rows={visitorRows} head="This month first" />}
        {stats && (
          <p className="text-sm text-gray-700">
            {drop
              ? `Most people stop between "${drop.from.toLowerCase()}" and "${drop.to.toLowerCase()}": ${Math.round(drop.keep * 100)}% keep going.`
              : 'Once about 20 people a month open the inquiries page, this will point out where most of them stop.'}
          </p>
        )}
      </section>

      <section className={`${ui.card} space-y-3`}>
        <div>
          <h3 className="font-semibold text-gray-900">Inquiries and events</h3>
          <p className="text-xs text-gray-500">By the month they were added, and how far each has gotten since.</p>
        </div>
        <Table months={months} rows={eventRows} head="Added in" />
        <p className="text-xs text-gray-500">"From the website" starts counting with this update; older inquiries are only in "Added".</p>
      </section>
    </div>
  )
}

export default Report
