import React, { useState } from 'react'
import { ui } from '../../components/TeamPage'
import { ago, entry, followUpDue, followUpMessage, lastContactAt, mailtoLink, smsLink, stamp, timeline, toMillis } from './history'

// Follow-up panel in the event editor: when we last talked, one-tap follow-up
// messages, quick history lines, and the timeline itself.
const QUICK = [
  { type: 'quote-sent', label: 'Sent the quote', text: 'Sent the quote' },
  { type: 'contact', label: 'They replied', text: 'They replied' },
  { type: 'contact', label: 'Talked or texted', text: 'Talked or texted' },
]

const DOT = {
  created: 'bg-gray-400',
  stage: 'bg-blue-500',
  quote: 'bg-amber-500',
  'quote-sent': 'bg-amber-600',
  contact: 'bg-green-600',
  followup: 'bg-green-600',
  note: 'bg-gray-500',
  change: 'bg-gray-400',
}

// Local date and time for inputs ("2026-11-12", "2026-11-12T14:30"), and back.
const pad = (n) => String(n).padStart(2, '0')
const localDay = (ms) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const localDateTime = (ms) => {
  const d = new Date(ms)
  return `${localDay(ms)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// One history line, with Edit: change when it happened and what it says, or delete it.
const HistoryLine = ({ h, editable, onEdit }) => {
  const [editing, setEditing] = useState(false)
  const [when, setWhen] = useState('')
  const [text, setText] = useState('')
  const [sure, setSure] = useState(false)
  const start = () => {
    setWhen(localDateTime(toMillis(h.at)))
    setText(h.text)
    setSure(false)
    setEditing(true)
  }
  const save = () => {
    const at = new Date(when).getTime()
    if (!Number.isFinite(at) || !text.trim()) return
    onEdit(h, { ...h, at, text: text.trim() })
    setEditing(false)
  }
  if (editing) {
    return (
      <li className="rounded-md border border-gray-200 bg-gray-50 p-2 space-y-2">
        <div className="flex flex-wrap gap-2">
          <input type="datetime-local" aria-label="When it happened" className={`${ui.input} w-auto`} value={when} max={localDateTime(Date.now())} onChange={(e) => setWhen(e.target.value)} />
          <input aria-label="What happened" className={`${ui.input} flex-1 min-w-[12rem]`} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" className={ui.btnPrimary} onClick={save}>
            Save
          </button>
          <button type="button" className={ui.btnQuiet} onClick={() => setEditing(false)}>
            Cancel
          </button>
          {sure ? (
            <span className="text-sm">
              Delete this line?{' '}
              <button type="button" className="underline text-red-700" onClick={() => onEdit(h, null)}>
                Delete
              </button>{' '}
              <button type="button" className="underline" onClick={() => setSure(false)}>
                Keep it
              </button>
            </span>
          ) : (
            <button type="button" className="text-sm underline text-red-700" onClick={() => setSure(true)}>
              Delete…
            </button>
          )}
        </div>
      </li>
    )
  }
  return (
    <li className="flex gap-2 items-baseline group">
      <span className={`inline-block w-2 h-2 rounded-full shrink-0 translate-y-[-1px] ${DOT[h.type] || 'bg-gray-400'}`} />
      <span className="text-gray-500 shrink-0 w-32">{stamp(h.at)}</span>
      <span className="text-gray-800 flex-1">{h.text}</span>
      {editable && (
        <button type="button" className="text-xs text-gray-500 underline shrink-0" onClick={start} aria-label={`Edit: ${h.text}`}>
          Edit
        </button>
      )}
    </li>
  )
}

const FollowUp = ({ event, isNew, onLog, onEdit }) => {
  const [note, setNote] = useState('')
  // When the quick buttons and notes say it happened: today (now), or an earlier
  // day you pick (at the same time of day), for things you forgot to log.
  const today = localDay(Date.now())
  const [day, setDay] = useState(today)
  const at = () => {
    if (!day || day === today) return Date.now()
    const now = new Date()
    const t = new Date(`${day}T${pad(now.getHours())}:${pad(now.getMinutes())}`).getTime()
    return Number.isFinite(t) ? t : Date.now()
  }
  const [copied, setCopied] = useState(false)
  const items = timeline(event)
  const last = lastContactAt(event)
  const due = followUpDue(event)
  const waiting = ['inquiry', 'contacted', 'quoted'].includes(event.status)
  const msg = followUpMessage(event)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.body)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      window.alert("Couldn't copy.")
    }
  }

  const addNote = () => {
    if (!note.trim()) return
    onLog(entry('note', note.trim(), at()))
    setNote('')
  }

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold">Follow-up and history</h3>
        {last != null && (
          <span className={`text-sm ${due ? 'text-amber-800 font-medium' : 'text-gray-500'}`}>Last contact {ago(last)}</span>
        )}
      </div>

      {waiting && (
        <div className={`rounded-md p-3 space-y-2 ${due ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
          <p className="text-sm text-gray-700">
            {due ? 'Time to follow up.' : 'Follow-up message, ready to send:'}
          </p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap border-l-2 border-gray-300 pl-2">{msg.body}</p>
          <div className="flex flex-wrap gap-2">
            {event.email && (
              <a className={ui.btnQuiet} href={mailtoLink(event.email, msg)} onClick={() => onLog(entry('followup', 'Follow-up email'))}>
                Email follow-up
              </a>
            )}
            {event.phone && (
              <a className={ui.btnQuiet} href={smsLink(event.phone, msg)} onClick={() => onLog(entry('followup', 'Follow-up text'))}>
                Text follow-up
              </a>
            )}
            <button type="button" className={ui.btnQuiet} onClick={copy}>
              {copied ? 'Copied' : 'Copy message'}
            </button>
          </div>
          <p className="text-xs text-gray-500">Email and text open your mail or messages app and add a line to the history below.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        {QUICK.map((q) => (
          <button key={q.label} type="button" className="px-3 py-1 rounded-full text-sm border bg-white border-gray-300 text-gray-700 hover:border-gray-900" onClick={() => onLog(entry(q.type, q.text, at()))}>
            + {q.label}
          </button>
        ))}
        <label className="flex items-center gap-1 text-sm text-gray-600">
          When
          <input type="date" aria-label="When it happened" className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white" value={day} max={today} onChange={(e) => setDay(e.target.value || today)} />
        </label>
        {day !== today && (
          <button type="button" className="text-xs underline text-gray-500" onClick={() => setDay(today)}>
            back to today
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <input
          className={ui.input}
          value={note}
          placeholder="Add to history (e.g. Sent SwipeSimple deposit invoice)"
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addNote()}
        />
        <button type="button" className={ui.btnQuiet} onClick={addNote}>
          Add
        </button>
      </div>

      {items.length > 0 ? (
        <ol className="space-y-1.5 text-sm">
          {[...items].reverse().map((h) => (
            <HistoryLine
              key={`${toMillis(h.at)}|${h.type}|${h.text}`}
              h={h}
              // Lines saved on the event can be edited ("Inquiry came in" made up from its creation time can't).
              editable={!!onEdit && (event.history || []).some((x) => toMillis(x.at) === toMillis(h.at) && x.type === h.type && x.text === h.text)}
              onEdit={onEdit}
            />
          ))}
        </ol>
      ) : (
        <p className="text-sm text-gray-500">{isNew ? 'History starts when you save.' : 'Nothing logged yet.'}</p>
      )}
    </section>
  )
}

export default FollowUp
