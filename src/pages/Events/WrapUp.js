import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { signInWithGoogle } from '../../utils/firebase'
import useEventAdmin from './useEventAdmin'
import { prettyDate } from './quote'
import { buildChoices, findRow } from './choices'
import { PageHeader, TeamPage, ui } from '../../components/TeamPage'

// Wrap-up after an event or prep day. Replaces the "money tracker" Google Form:
// the server (functions/wrapup.js) lists recent events from the tracker and
// Google Calendar, and writes the answers into the next row of the money
// tracker's Form Responses tab. The fields come from that tab's header row,
// so adding a column (a new person's hours, say) adds a field here. Wrap-ups
// from the last few days can be edited, which updates their row in place.

const { input, btnPrimary, btnQuiet } = ui

// How each sheet column is asked for, by its header text.
const kindOf = (h) => {
  if (/^timestamp$/i.test(h)) return 'skip'
  if (/pizza friday or event/i.test(h)) return 'name'
  if (/date of event/i.test(h)) return 'date'
  if (/notes/i.test(h)) return 'notes'
  if (/sell out/i.test(h)) return 'yesno'
  if (/what time/i.test(h)) return 'time'
  if (/hours?\s*$/i.test(h)) return 'hours'
  return 'number'
}
// Sections of the form, in order. Each column lands in the first group whose
// pattern matches its header, ordered by that group's list; anything new and
// unmatched goes under "Other" so a new sheet column still shows up.
const GROUPS = [
  { key: 'pizzas', title: 'Pizzas', cols: 'grid-cols-2 sm:grid-cols-3', order: [/dough made/i, /how many sold/i, /comped/i, /more could/i, /sell out/i, /what time/i] },
  { key: 'money', title: 'Money in', cols: 'grid-cols-2 sm:grid-cols-4', order: [/venmo/i, /cash/i, /simpleswipe|card/i, /tip/i, /extras.*sold/i, /price of extras/i] },
  { key: 'labor', title: 'Labor', cols: 'grid-cols-3 sm:grid-cols-4', order: [/hours?\s*$/i, /employee cost/i] },
]
const groupOf = (h) => {
  for (const g of GROUPS) {
    const i = g.order.findIndex((re) => re.test(h))
    if (i >= 0) return { key: g.key, rank: i }
  }
  return { key: 'other', rank: 0 }
}
const isMoney = (h) => /venmo|cash|simpleswipe|tip|cost|price/i.test(h)

const label = (h) =>
  String(h)
    .replace(/\?$/, '')
    .replace(/^Or employee cost$/i, 'Other labor cost')
    .replace(/^How much (venmo|cash|simpleswipe)$/i, (_, w) => w[0].toUpperCase() + w.slice(1))
    .replace(/^Tip money$/i, 'Tips')
    .replace(/^How much extras \(bread\/dessert\) sold$/i, 'Extras sold (bread/dessert)')
    .replace(/^Potentially how many more could we have sold$/i, 'Could have sold more')
    .replace(/^How much dough made$/i, 'Dough made')
    .replace(/^How many (sold|comped)$/i, (_, w) => w[0].toUpperCase() + w.slice(1))
    .replace(/^My hours$/i, 'Me')
    .replace(/\s*hours$/i, '')

const callable = (name) => httpsCallable(getFunctions(), name)

const moneyIn = (headers, values) =>
  headers
    .filter((h) => /venmo|cash|simpleswipe/i.test(h))
    .reduce((t, h) => t + (Number(values[h]) || 0), 0)
const dollars = (n) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`

const Field = ({ label: text, children, className = '' }) => (
  <label className={`block text-left text-xs text-gray-600 ${className}`}>
    <span className="block mb-1">{text}</span>
    {children}
  </label>
)

// edit: a saved row from recentWrapUps, to change it rather than add a new one.
// planned: {balls, for} from the Planner (dough made for this date), or null.
const WrapUpForm = ({ headers, choice, edit = null, today, planned = null, onDone, onBack }) => {
  const nameH = headers.find((h) => kindOf(h) === 'name')
  const dateH = headers.find((h) => kindOf(h) === 'date')
  const notesH = headers.find((h) => kindOf(h) === 'notes')
  const doughH = headers.find((h) => /dough made/i.test(h))
  const soldH = headers.find((h) => /how many sold/i.test(h))
  const compedH = headers.find((h) => /comped/i.test(h))
  const [values, setValues] = useState(() =>
    edit
      ? edit.values
      : {
          ...(nameH ? { [nameH]: choice.name || '' } : {}),
          ...(dateH ? { [dateH]: choice.date || today } : {}),
          ...(doughH && planned ? { [doughH]: String(planned.balls) } : {}),
        }
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (h, v) => setValues((x) => ({ ...x, [h]: v }))

  const addNote = (text) => set(notesH, [values[notesH], text].filter(Boolean).join('\n'))

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      if (edit) {
        const res = await callable('updateWrapUp')({ row: edit.row, key: edit.key, values })
        onDone({ row: res.data.row, edited: true, changed: res.data.changed })
        return
      }
      const calendarEntryId = choice.key.startsWith('c:') ? choice.key.slice(2) : null
      const res = await callable('submitWrapUp')({ values, eventId: choice.eventId, calendarEntryId })
      onDone({ row: res.data.row, edited: false })
    } catch (e) {
      setError(e.message || "Couldn't save.")
      setBusy(false)
    }
  }

  const asked = headers.filter((h) => !['skip', 'name', 'date', 'notes'].includes(kindOf(h)))
  const sections = [...GROUPS, { key: 'other', title: 'Other', cols: 'grid-cols-2 sm:grid-cols-3' }]
    .map((g) => ({
      ...g,
      headers: asked
        .filter((h) => groupOf(h).key === g.key)
        .sort((a, b) => groupOf(a).rank - groupOf(b).rank),
    }))
    .filter((g) => g.headers.length)
  const takenIn = moneyIn(headers, values)
  // Dough left over once sold and comped are in.
  const num = (h) => (h && values[h] !== '' && values[h] != null ? Number(values[h]) : null)
  const leftover = num(doughH) != null && num(soldH) != null ? num(doughH) - num(soldH) - (num(compedH) || 0) : null

  const control = (h) => {
    const kind = kindOf(h)
    const v = values[h] ?? ''
    if (kind === 'yesno') {
      return (
        <select className={input} value={v} onChange={(e) => set(h, e.target.value)}>
          <option value="" />
          <option>Yes</option>
          <option>No</option>
        </select>
      )
    }
    if (kind === 'time') return <input className={input} type="time" value={v} onChange={(e) => set(h, e.target.value)} />
    const box = <input className={input} type="number" inputMode="decimal" step="any" value={v} onChange={(e) => set(h, e.target.value)} />
    if (!isMoney(h)) return box
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" aria-hidden="true">$</span>
        <input className={`${input} pl-6`} type="number" inputMode="decimal" step="any" value={v} onChange={(e) => set(h, e.target.value)} />
      </div>
    )
  }

  return (
    <div className={`${ui.card} sm:p-6 space-y-5`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold">{edit ? 'Edit' : 'Wrap up'}: {choice.title}</h2>
        <button type="button" className="text-sm underline text-gray-600" onClick={onBack}>
          Pick another
        </button>
      </div>

      {(choice.info || choice.notes.length > 0) && (
        <section className="bg-amber-50 border border-amber-200 rounded-md p-3 space-y-2 text-sm">
          {choice.info && <p className="text-gray-700">{choice.info}</p>}
          {choice.notes.map((n) => (
            <div key={n} className="flex gap-2 items-start">
              <p className="whitespace-pre-wrap flex-1 text-gray-800">{n}</p>
              {notesH && (
                <button type="button" className="text-xs underline text-amber-800 shrink-0" onClick={() => addNote(n)}>
                  Add to notes
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      <section className="grid sm:grid-cols-2 gap-3">
        {nameH && (
          <Field label="Event (Pizza Friday, Prep, or the event name)">
            <input className={input} value={values[nameH] || ''} onChange={(e) => set(nameH, e.target.value)} />
          </Field>
        )}
        {dateH && (
          <Field label="Date of event">
            <input className={input} type="date" value={values[dateH] || ''} onChange={(e) => set(dateH, e.target.value)} />
          </Field>
        )}
      </section>

      {sections.map((g) => (
        <section key={g.key} className="border-t border-gray-200 pt-4">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900">{g.title}</h3>
            {g.key === 'money' && takenIn > 0 && (
              <span className="text-sm text-gray-600">
                Venmo + cash + card: <strong>{dollars(takenIn)}</strong>
              </span>
            )}
            {g.key === 'labor' && <span className="text-xs text-gray-500">Hours each person worked</span>}
            {g.key === 'pizzas' && leftover != null && (
              <span className={`text-sm ${leftover < 0 ? 'text-red-700' : 'text-gray-600'}`}>
                {leftover < 0 ? `${-leftover} more than the dough made` : <>Dough left over: <strong>{leftover}</strong></>}
              </span>
            )}
          </div>
          {g.key === 'pizzas' && !edit && planned && doughH && (
            <p className="text-xs text-gray-500 -mt-1 mb-2">
              Dough made is from the Planner: {planned.balls} balls for {planned.for}. Change it if you made a different amount.
            </p>
          )}
          <div className={`grid ${g.cols} gap-3`}>
            {g.headers.map((h) => (
              <Field key={h} label={label(h)}>
                {control(h)}
              </Field>
            ))}
          </div>
        </section>
      ))}

      {notesH && (
        <Field className="border-t border-gray-200 pt-4" label="Notes (holidays, weather, what to remember)">
          <textarea className={input} rows={3} value={values[notesH] || ''} onChange={(e) => set(notesH, e.target.value)} />
        </Field>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className={btnQuiet} onClick={onBack}>
          Cancel
        </button>
        <button type="button" className={btnPrimary} disabled={busy} onClick={submit}>
          {busy ? 'Saving…' : edit ? 'Save changes' : 'Save to money tracker'}
        </button>
      </div>
    </div>
  )
}

// bare: inside the Planner's Wrap up tab, without the page frame and title.
const Bare = ({ children }) => <div className="space-y-4 text-left">{children}</div>
const OPTIONS_KEY = 'bybo-wrapup-options'
const todayHere = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Denver' })

// Lives only in the Planner's Wrap up tab (/events/wrapup redirects there).
// fromPlanner(choice): {balls, for} when the Planner had dough for that date (Planner tab only).
const WrapUp = ({ bare = true, onChange = () => {}, fromPlanner = () => null }) => {
  const Shell = bare ? Bare : TeamPage
  const Header = bare ? () => null : PageHeader
  const { user, loading, access } = useEventAdmin()
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [choice, setChoice] = useState(null)
  const [saved, setSaved] = useState(null)
  const [hidden, setHidden] = useState([])
  const [recent, setRecent] = useState(null)
  const [recentError, setRecentError] = useState('')
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')
  const wanted = new URLSearchParams(useLocation().search).get('key')

  const loadOptions = () =>
    callable('wrapUpOptions')()
      .then((res) => {
        setData(res.data)
        try {
          localStorage.setItem(OPTIONS_KEY, JSON.stringify(res.data))
        } catch (e) {
          /* storage full or blocked */
        }
      })
      .catch((e) => setLoadError(e.message || "Couldn't load recent events."))
  // Not kept in the browser like the lists above: these are money numbers.
  const loadRecent = () =>
    callable('recentWrapUps')()
      .then((res) => {
        setRecent(res.data)
        setRecentError('')
      })
      .catch((e) => setRecentError(e.message || "Couldn't load recent wrap-ups."))

  // Last lists from the server, shown at once while the fresh ones load
  // (reading the sheets and calendar takes a few seconds).
  useEffect(() => {
    if (access !== true) return
    try {
      const last = JSON.parse(localStorage.getItem(OPTIONS_KEY) || 'null')
      if (last) setData((d) => d || { ...last, today: todayHere() })
    } catch (e) {
      /* nothing saved */
    }
    loadOptions()
    loadRecent()
  }, [access])

  const choices = useMemo(
    () => (data ? buildChoices(data.events, data.calendar, data.today).filter((c) => !c.skipped) : []),
    [data]
  )
  const [openedFor, setOpenedFor] = useState(null)

  // A wrapped-up entry opens its saved row, never a blank form: saving a blank
  // one would add a second row for the same event.
  const open = useCallback((c) => {
    setNotice('')
    if (!c.wrappedUp) {
      setChoice(c)
      return
    }
    if (!recent) {
      setNotice(recentError || 'Still loading recent wrap-ups. Try again in a moment.')
      return
    }
    const { row, sameDay } = findRow(recent.rows, c)
    if (row) setEditing(row)
    else if (sameDay) setNotice('Pick the one to change under "Edit a recent wrap-up" below.')
    else setNotice(`That wrap-up isn't in the last ${recent.days} days of the money tracker. Change older ones in its Form Responses tab.`)
  }, [recent, recentError])

  // Opened from a wrap-up notification (?key=): go straight to that event's
  // form, or its saved row if it's already wrapped up. Each new key opens once.
  // A wrapped-up one waits for the recent rows so it can find its row.
  useEffect(() => {
    if (!wanted || wanted === openedFor || !data || !data.headers.length) return
    const c = choices.find((x) => x.key === wanted)
    if (c && c.wrappedUp && !recent && !recentError) return
    if (c) {
      setSaved(null)
      setEditing(null)
      setChoice(null)
      open(c)
    }
    setOpenedFor(wanted)
  }, [wanted, openedFor, data, choices, recent, recentError, open])

  const finished = (result) => {
    setSaved(result)
    onChange()
    setRecent(null)
    loadRecent()
    loadOptions()
  }

  // Close one out without a wrap-up: it drops off here and its reminders stop.
  const skip = async (c) => {
    setHidden((h) => [...h, c.key])
    try {
      await callable('skipWrapUp')({ key: c.key })
      onChange()
    } catch (e) {
      setHidden((h) => h.filter((k) => k !== c.key))
      setLoadError(e.message || "Couldn't skip that one.")
    }
  }

  if (loading) return <Shell><p className="text-gray-500">Loading…</p></Shell>
  if (!user) {
    return (
      <Shell>
        <Header title="Wrap-up" />
        <button type="button" className={btnPrimary} onClick={signInWithGoogle}>
          Sign in with Google
        </button>
      </Shell>
    )
  }
  if (access === 'denied') {
    return (
      <Shell>
        <Header title="Wrap-up" />
        <p className="text-gray-700">{user.email} isn't an admin.</p>
      </Shell>
    )
  }

  if (saved) {
    return (
      <Shell>
        <Header title="Wrap-up" />
        <p className="text-gray-800">
          {saved.edited && saved.changed === 0
            ? 'No changes to save.'
            : saved.edited
              ? `Updated the money tracker (row ${saved.row}).`
              : `Saved to the money tracker (row ${saved.row}).`}
        </p>
        <div className="flex gap-2">
          <button type="button" className={btnQuiet} onClick={() => { setSaved(null); setChoice(null); setEditing(null) }}>
            {saved.edited ? 'Back to wrap-ups' : 'Wrap up another'}
          </button>
          {!bare && <Link className={btnQuiet} to="/events">Back to events</Link>}
        </div>
      </Shell>
    )
  }

  if (editing && data) {
    return (
      <Shell>
        <WrapUpForm
          key={editing.key}
          headers={data.headers}
          choice={{ key: `row:${editing.row}`, title: editing.name || 'Wrap-up', info: prettyDate(editing.date), notes: [] }}
          edit={editing}
          today={data.today}
          onDone={finished}
          onBack={() => setEditing(null)}
        />
      </Shell>
    )
  }

  if (choice && data) {
    return (
      <Shell>
        <WrapUpForm
          headers={data.headers}
          choice={choice}
          planned={fromPlanner(choice)}
          today={data.today}
          onDone={finished}
          onBack={() => setChoice(null)}
        />
      </Shell>
    )
  }

  const blank = (name, title) => ({ key: name, eventId: null, title, name, date: data ? data.today : '', info: '', notes: [] })

  return (
    <Shell>
      <Header title="Wrap-up" sub="Log an event or prep day to the money tracker" />
      {loadError && <p className="text-red-700">{loadError}</p>}
      {!data && !loadError && <p className="text-gray-500">Loading recent events and your calendar…</p>}
      {data && (
        <>
          {data.problems.length > 0 && (
            <ul className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3 list-disc pl-6">
              {data.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          {data.headers.length > 0 && (
            <>
              <p className="text-gray-700">Which one are you wrapping up?</p>
              {notice && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">{notice}</p>}
              <ul className="space-y-2">
                {choices.filter((c) => !hidden.includes(c.key)).map((c) => (
                  <li key={c.key} className="flex gap-2 items-stretch">
                    <button
                      type="button"
                      onClick={() => open(c)}
                      className="flex-1 min-w-0 text-left bg-white rounded-xl shadow-sm border border-gray-200 hover:border-amber-500 p-4"
                    >
                      <span className="flex justify-between gap-2">
                        <span className="font-semibold">{c.title}</span>
                        {c.wrappedUp && <span className="text-xs text-green-700">Wrapped up</span>}
                      </span>
                      <span className="block text-sm text-gray-600">
                        {[prettyDate(c.date), c.sub].filter(Boolean).join(' · ')}
                      </span>
                      {c.notes.length > 0 && (
                        <span className="block text-sm text-gray-500 truncate">{c.notes.join(' · ')}</span>
                      )}
                    </button>
                    {!c.wrappedUp && (
                      <button type="button" className={btnQuiet} onClick={() => skip(c)} title="No wrap-up needed; stops its reminders">
                        Skip
                      </button>
                    )}
                  </li>
                ))}
                {choices.length === 0 && <li className="text-gray-500">Nothing in the last week.</li>}
              </ul>
              <div className="flex gap-2 flex-wrap">
                <button type="button" className={btnQuiet} onClick={() => setChoice(blank('Prep', 'Prep day'))}>
                  Prep day
                </button>
                <button type="button" className={btnQuiet} onClick={() => setChoice(blank('', 'Something else'))}>
                  Something else
                </button>
              </div>
              {recentError && <p className="text-sm text-red-700">{recentError}</p>}
              {recent && recent.rows.length > 0 && (
                <section className="border-t border-gray-200 pt-4 space-y-2">
                  <h3 className="font-semibold text-gray-900">Edit a recent wrap-up</h3>
                  <p className="text-xs text-gray-500">From the last {recent.days} days. Change older ones in the money tracker's Form Responses tab.</p>
                  <ul className="space-y-2">
                    {recent.rows.map((r) => (
                      <li key={r.row}>
                        <button
                          type="button"
                          onClick={() => { setNotice(''); setEditing(r) }}
                          className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-200 hover:border-amber-500 p-4"
                        >
                          <span className="flex justify-between gap-2">
                            <span className="font-semibold">{r.name || 'Wrap-up'}</span>
                            {moneyIn(data.headers, r.values) > 0 && (
                              <span className="text-sm text-gray-700">{dollars(moneyIn(data.headers, r.values))}</span>
                            )}
                          </span>
                          <span className="block text-sm text-gray-600">{prettyDate(r.date)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </>
      )}
    </Shell>
  )
}

export default WrapUp
