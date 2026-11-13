import React, { useCallback, useEffect, useState } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../utils/db'
import { signInWithGoogle } from '../../utils/firebase'
import useEventAdmin from '../Events/useEventAdmin'
import { prettyDate } from '../Events/quote'
import { PageHeader, TeamPage, ui } from '../../components/TeamPage'

// Profit First transfers (admins). The server (functions/money.js) works out
// what's waiting from the wrap-ups in the money tracker; the transfers are made
// by hand in the bank's app, then "Mark as moved" records them so nothing
// counts twice. Percentages save to Firestore eventSettings/money.

const { input, btnPrimary, btnQuiet, card } = ui
const callable = (name) => httpsCallable(getFunctions(), name)
const dollars = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const GROUP_INFO = {
  pizza: { title: 'Pizza', note: 'Ingredients come off first; the other percentages are of what’s left.' },
  enb: { title: 'ENB', note: 'Wrap-ups whose event name starts with “ENB”.' },
}
const PARTS = [
  { key: 'materials', label: 'Ingredients' },
  { key: 'profit', label: 'Profit' },
  { key: 'owner', label: "Owner's Pay" },
  { key: 'tax', label: 'Tax' },
]

const Line = ({ label, value, strong }) => (
  <div className={`flex justify-between gap-3 ${strong ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
    <span>{label}</span>
    <span className="tabular-nums">{dollars(value)}</span>
  </div>
)

const Percentages = ({ settings, onSaved }) => {
  const [splits, setSplits] = useState(settings.splits)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const set = (g, k, v) => setSplits((s) => ({ ...s, [g]: { ...s[g], [k]: v } }))
  const opexOf = (s) => 100 - Number(s.profit || 0) - Number(s.owner || 0) - Number(s.tax || 0)
  const bad = Object.values(splits).some(
    (s) => opexOf(s) < 0 || PARTS.some((p) => s[p.key] === '' || Number(s[p.key]) < 0 || Number(s[p.key]) > 100)
  )

  const save = async () => {
    setBusy(true)
    setMsg('')
    try {
      const clean = Object.fromEntries(
        Object.entries(splits).map(([g, s]) => [g, Object.fromEntries(PARTS.map((p) => [p.key, Number(s[p.key])]))])
      )
      await setDoc(doc(db, 'eventSettings', 'money'), { splits: clean }, { merge: true })
      setMsg('Saved.')
      onSaved()
    } catch (e) {
      setMsg("Couldn't save. Try again.")
    }
    setBusy(false)
  }

  return (
    <section className={`${card} space-y-4`}>
      <div>
        <h2 className="font-semibold text-gray-900">Percentages</h2>
        <p className="text-sm text-gray-500">Raise them a little each quarter as the business can afford it. Operating expenses get whatever is left.</p>
      </div>
      {Object.keys(GROUP_INFO).map((g) => (
        <div key={g} className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800">{GROUP_INFO[g].title}</h3>
          <p className="text-xs text-gray-500">{GROUP_INFO[g].note}</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {PARTS.map((p) => (
              <label key={p.key} className="block text-xs text-gray-600">
                <span className="block mb-1">{p.label} %</span>
                <input
                  className={input}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.5"
                  value={splits[g][p.key]}
                  onChange={(e) => set(g, p.key, e.target.value)}
                />
              </label>
            ))}
            <div className="text-xs text-gray-600">
              <span className="block mb-1">Operating %</span>
              <span className={`block px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm ${opexOf(splits[g]) < 0 ? 'text-red-700' : 'text-gray-800'}`}>
                {opexOf(splits[g])}
              </span>
            </div>
          </div>
        </div>
      ))}
      {bad && <p className="text-sm text-red-700">Each percentage needs to be 0 to 100, and Profit + Owner's Pay + Tax can't be over 100.</p>}
      <div className="flex items-center justify-end gap-3">
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
        <button type="button" className={btnPrimary} disabled={busy || bad} onClick={save}>
          {busy ? 'Saving…' : 'Save percentages'}
        </button>
      </div>
    </section>
  )
}

const Money = () => {
  const { user, loading, access } = useEventAdmin()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState('')
  const [showRows, setShowRows] = useState(false)

  const load = useCallback(() => {
    setError('')
    return callable('moneyToMove')()
      .then((res) => setData(res.data))
      .catch((e) => setError(e.message || "Couldn't load the money tracker."))
  }, [])
  useEffect(() => {
    if (access === true) load()
  }, [access, load])

  const markMoved = async () => {
    setBusy(true)
    setError('')
    try {
      await callable('markMoneyMoved')({ stamp: data.stamp })
      setDone('Marked as moved. New wrap-ups will show here for the next transfer.')
      await load()
    } catch (e) {
      setError(e.message || "Couldn't record it.")
      await load()
    }
    setBusy(false)
  }

  if (loading) return <TeamPage><p className="text-gray-500">Loading…</p></TeamPage>
  if (!user) {
    return (
      <TeamPage>
        <PageHeader title="Money" />
        <button type="button" className={btnPrimary} onClick={signInWithGoogle}>
          Sign in with Google
        </button>
      </TeamPage>
    )
  }
  if (access === 'denied') {
    return (
      <TeamPage>
        <PageHeader title="Money" />
        <p className="text-gray-700">{user.email} isn't an admin.</p>
      </TeamPage>
    )
  }

  const t = data && data.split.transfers
  const waiting = data && data.rows.length > 0
  return (
    <TeamPage>
      <PageHeader title="Money" sub="Profit First transfers on the 10th and 25th" />
      {error && <p className="text-sm text-red-700">{error}</p>}
      {done && <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">{done}</p>}
      {!data && !error && <p className="text-gray-500">Adding up the wrap-ups…</p>}
      {data && (
        <>
          <section className={`${card} space-y-3`}>
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <h2 className="font-semibold text-gray-900">Ready to move</h2>
              <span className="text-xs text-gray-500">
                {data.nextDay === data.today ? 'Today is a transfer day' : `Next transfer day: ${prettyDate(data.nextDay)}`}
              </span>
            </div>
            {!waiting ? (
              <p className="text-gray-600">Nothing waiting. New wrap-ups will show up here.</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">Move these from checking in the America First app:</p>
                <div className="space-y-1 text-base">
                  <Line label="To Profit" value={t.profit} strong />
                  <Line label="To Owner's Pay" value={t.owner} strong />
                  <Line label="To Tax" value={t.tax} strong />
                </div>
                <div className="border-t border-gray-200 pt-2 space-y-1 text-sm">
                  <Line
                    label="Stays in checking (ingredients + operating)"
                    value={data.split.stays}
                  />
                  <Line label="Money in (Venmo, cash, card; no tips)" value={data.split.groups.pizza.deposits + data.split.groups.enb.deposits} />
                </div>
                <button type="button" className="text-sm underline text-gray-600" onClick={() => setShowRows((v) => !v)}>
                  {showRows ? 'Hide' : 'Show'} the {data.rows.length} wrap-up{data.rows.length === 1 ? '' : 's'} this covers
                </button>
                {showRows && (
                  <ul className="text-sm divide-y divide-gray-100">
                    {data.rows.map((r) => (
                      <li key={r.id} className="flex justify-between gap-3 py-1">
                        <span className="min-w-0 truncate">
                          {prettyDate(r.date)} · {r.name || 'Wrap-up'}
                          {r.group === 'enb' && <span className="text-xs text-gray-500"> (ENB split)</span>}
                        </span>
                        <span className="tabular-nums shrink-0">{dollars(r.pending)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex justify-end">
                  <button type="button" className={btnPrimary} disabled={busy} onClick={markMoved}>
                    {busy ? 'Saving…' : "I've moved it: mark as moved"}
                  </button>
                </div>
              </>
            )}
          </section>

          <Percentages key={JSON.stringify(data.settings.splits)} settings={data.settings} onSaved={load} />

          {data.moves.length > 0 && (
            <section className={`${card} space-y-2`}>
              <h2 className="font-semibold text-gray-900">Past transfers</h2>
              <ul className="text-sm divide-y divide-gray-100">
                {data.moves.map((m) => (
                  <li key={m.id} className="py-2 flex justify-between gap-3 flex-wrap">
                    <span className="text-gray-700">{m.at ? new Date(m.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                    <span className="text-gray-600 tabular-nums">
                      Profit {dollars(m.transfers.profit)} · Owner {dollars(m.transfers.owner)} · Tax {dollars(m.transfers.tax)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="text-xs text-gray-500">
            Counts wrap-ups from {prettyDate(data.settings.startDate)} on. Edit a wrap-up that got more money later and only the extra shows up here.
          </p>
          <div>
            <button type="button" className={btnQuiet} onClick={load}>
              Refresh
            </button>
          </div>
        </>
      )}
    </TeamPage>
  )
}

export default Money
