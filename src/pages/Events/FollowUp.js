import React, { useState } from 'react'
import { ui } from '../../components/TeamPage'
import { ago, entry, followUpDue, followUpMessage, lastContactAt, mailtoLink, smsLink, stamp, timeline } from './history'

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

const FollowUp = ({ event, isNew, onLog }) => {
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)
  const items = timeline(event)
  const last = lastContactAt(event)
  const due = followUpDue(event)
  const waiting = ['inquiry', 'quoted'].includes(event.status)
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
    onLog(entry('note', note.trim()))
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

      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button key={q.label} type="button" className="px-3 py-1 rounded-full text-sm border bg-white border-gray-300 text-gray-700 hover:border-gray-900" onClick={() => onLog(entry(q.type, q.text))}>
            + {q.label}
          </button>
        ))}
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
          {[...items].reverse().map((h, i) => (
            <li key={i} className="flex gap-2 items-baseline">
              <span className={`inline-block w-2 h-2 rounded-full shrink-0 translate-y-[-1px] ${DOT[h.type] || 'bg-gray-400'}`} />
              <span className="text-gray-500 shrink-0 w-32">{stamp(h.at)}</span>
              <span className="text-gray-800">{h.text}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-gray-500">{isNew ? 'History starts when you save.' : 'Nothing logged yet.'}</p>
      )}
    </section>
  )
}

export default FollowUp
