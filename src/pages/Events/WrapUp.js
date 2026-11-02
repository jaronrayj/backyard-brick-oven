import React, { useEffect, useMemo, useState } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { signInWithGoogle } from '../../utils/firebase'
import useEventAdmin from './useEventAdmin'
import { prettyDate } from './quote'
import { buildChoices } from './choices'

// Wrap-up after an event or prep day. Replaces the "money tracker" Google Form:
// the server (functions/wrapup.js) lists recent events from the tracker and
// Google Calendar, and writes the answers into the next row of the money
// tracker's Form Responses tab. The fields come from that tab's header row,
// so adding a column (a new person's hours, say) adds a field here.

const input = 'w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white'
const btn = 'px-3 py-1.5 rounded-md text-sm font-medium border'
const btnPrimary = `${btn} bg-amber-600 border-amber-600 text-white hover:bg-amber-700 disabled:opacity-50`
const btnQuiet = `${btn} bg-white border-gray-300 text-gray-700 hover:border-gray-900`

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
const label = (h) => String(h).replace(/\?$/, '').replace(/^Or employee cost$/i, 'Other employee cost')

const callable = (name) => httpsCallable(getFunctions(), name)

const Field = ({ label: text, children, className = '' }) => (
  <label className={`block text-left text-xs text-gray-600 ${className}`}>
    <span className="block mb-1">{text}</span>
    {children}
  </label>
)

const WrapUpForm = ({ headers, choice, today, onDone, onBack }) => {
  const nameH = headers.find((h) => kindOf(h) === 'name')
  const dateH = headers.find((h) => kindOf(h) === 'date')
  const notesH = headers.find((h) => kindOf(h) === 'notes')
  const [values, setValues] = useState(() => ({
    ...(nameH ? { [nameH]: choice.name || '' } : {}),
    ...(dateH ? { [dateH]: choice.date || today } : {}),
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (h, v) => setValues((x) => ({ ...x, [h]: v }))

  const addNote = (text) => set(notesH, [values[notesH], text].filter(Boolean).join('\n'))

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await callable('submitWrapUp')({ values, eventId: choice.eventId })
      onDone(res.data.row)
    } catch (e) {
      setError(e.message || "Couldn't save.")
      setBusy(false)
    }
  }

  const fields = headers.filter((h) => !['skip', 'name', 'date', 'notes', 'hours'].includes(kindOf(h)))
  const hours = headers.filter((h) => kindOf(h) === 'hours')

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
    return <input className={input} type="number" inputMode="decimal" step="any" value={v} onChange={(e) => set(h, e.target.value)} />
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 space-y-5 text-left">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Wrap up: {choice.title}</h2>
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

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {fields.map((h) => (
          <Field key={h} label={label(h)}>
            {control(h)}
          </Field>
        ))}
      </section>

      {hours.length > 0 && (
        <section>
          <h3 className="font-semibold mb-2">Hours</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {hours.map((h) => (
              <Field key={h} label={label(h).replace(/\s*hours$/i, '')}>
                {control(h)}
              </Field>
            ))}
          </div>
        </section>
      )}

      {notesH && (
        <Field label="Notes (holidays, weather, what to remember)">
          <textarea className={input} rows={3} value={values[notesH] || ''} onChange={(e) => set(notesH, e.target.value)} />
        </Field>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className={btnQuiet} onClick={onBack}>
          Cancel
        </button>
        <button type="button" className={btnPrimary} disabled={busy} onClick={submit}>
          {busy ? 'Saving…' : 'Save to money tracker'}
        </button>
      </div>
    </div>
  )
}

const Shell = ({ children }) => <div className="max-w-3xl mx-auto px-4 py-8 space-y-4 text-left">{children}</div>

const WrapUp = () => {
  const { user, loading, access } = useEventAdmin()
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [choice, setChoice] = useState(null)
  const [saved, setSaved] = useState(null)

  useEffect(() => {
    if (access !== true) return
    callable('wrapUpOptions')()
      .then((res) => setData(res.data))
      .catch((e) => setLoadError(e.message || "Couldn't load recent events."))
  }, [access])

  const choices = useMemo(() => (data ? buildChoices(data.events, data.calendar, data.today) : []), [data])

  if (loading) return <Shell><p className="text-gray-500">Loading…</p></Shell>
  if (!user) {
    return (
      <Shell>
        <h1 className="text-3xl font-mono">Wrap up</h1>
        <button type="button" className={btnPrimary} onClick={signInWithGoogle}>
          Sign in with Google
        </button>
      </Shell>
    )
  }
  if (access === 'denied') {
    return (
      <Shell>
        <h1 className="text-3xl font-mono">Wrap up</h1>
        <p className="text-gray-700">{user.email} isn't an admin.</p>
      </Shell>
    )
  }

  if (saved) {
    return (
      <Shell>
        <h1 className="text-3xl font-mono">Wrap up</h1>
        <p className="text-gray-800">Saved to the money tracker (row {saved}).</p>
        <div className="flex gap-2">
          <button type="button" className={btnQuiet} onClick={() => { setSaved(null); setChoice(null) }}>
            Wrap up another
          </button>
          <a className={btnQuiet} href="/events">Back to events</a>
        </div>
      </Shell>
    )
  }

  if (choice && data) {
    return (
      <Shell>
        <WrapUpForm headers={data.headers} choice={choice} today={data.today} onDone={setSaved} onBack={() => setChoice(null)} />
      </Shell>
    )
  }

  const blank = (name, title) => ({ key: name, eventId: null, title, name, date: data ? data.today : '', info: '', notes: [] })

  return (
    <Shell>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-3xl font-mono">Wrap up</h1>
        <a href="/events" className="text-sm underline text-gray-600">Events</a>
      </div>
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
              <ul className="space-y-2">
                {choices.map((c) => (
                  <li key={c.key}>
                    <button
                      type="button"
                      onClick={() => setChoice(c)}
                      className="w-full text-left bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-900 p-3"
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
                  </li>
                ))}
                {choices.length === 0 && <li className="text-gray-500">Nothing in the last three weeks.</li>}
              </ul>
              <div className="flex gap-2 flex-wrap">
                <button type="button" className={btnQuiet} onClick={() => setChoice(blank('Prep', 'Prep day'))}>
                  Prep day
                </button>
                <button type="button" className={btnQuiet} onClick={() => setChoice(blank('', 'Something else'))}>
                  Something else
                </button>
              </div>
            </>
          )}
        </>
      )}
    </Shell>
  )
}

export default WrapUp
