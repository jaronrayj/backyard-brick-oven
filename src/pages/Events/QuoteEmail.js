import React, { useEffect, useMemo, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db } from '../../utils/db'
import { ui } from '../../components/TeamPage'
import { DEFAULT_QUOTE_EMAIL, appendSignature, dropOldSignOff, signatureFrom, tastingWhen } from './replyText'
import { quoteEventWords, renderQuoteEmail } from './quoteEmailText'
import { reviewGreetingName } from './reviewAskText'

// Event editor > Email the quote: the quote email (wording from Events >
// Emails, editable here for this one email), tasting times to offer, a
// preview of exactly what's sent, and Send (functions/tasting.js sendQuoteEmail).
// Unsaved changes are saved first (onSave keeps the editor open), so the flow
// is: fill in the event and quote, Email the quote, Send.

const emailOf = (v) => (/[^\s/<>,;]+@[^\s/<>,;]+\.[^\s/<>,;]+/.exec(String(v || '')) || [''])[0]
// What the quote email depends on; any unsaved change to these means Save first.
const sentFields = (e) => JSON.stringify([e.name, e.email, e.eventType, e.date, e.quote])
// "2026-11-17T17:00" -> ISO, in this device's time zone (Utah).
const toIso = (v) => {
  const d = new Date(v)
  return v && !Number.isNaN(d.getTime()) ? d.toISOString() : ''
}

// Tasting times: a date plus a time in 15-minute steps, 7:00 am to 10:00 pm.
const DEFAULT_TASTING_TIME = '17:00' // 5 pm
export const TASTING_CLOCK = Array.from({ length: (22 - 7) * 4 + 1 }, (_, i) => {
  const mins = 7 * 60 + i * 15
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return {
    value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    label: `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`,
  }
})
const blankTime = (time = DEFAULT_TASTING_TIME) => ({ date: '', time })

const QuoteEmail = ({ id, event, initial, onSave, onSent }) => {
  const [open, setOpen] = useState(false)
  const [template, setTemplate] = useState(null)
  const [signature, setSignature] = useState(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [times, setTimes] = useState([blankTime()])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || template) return
    getDoc(doc(db, 'eventSettings', 'emails'))
      .then((snap) => {
        const t = { ...DEFAULT_QUOTE_EMAIL, ...((snap.exists() && snap.data().quoteEmail) || {}) }
        setSignature(signatureFrom(snap.exists() && snap.data()))
        const fill = (s) => String(s).replace(/\{name\}/g, reviewGreetingName(event.name)).replace(/\{event\}/g, quoteEventWords(event))
        setTemplate(t)
        setSubject(fill(t.subject))
        setBody(fill(dropOldSignOff(t.body)))
      })
      .catch(() => setError("Couldn't load the email wording."))
  }, [open, template, event])

  // Free tastings are for weddings only; other events never offer times.
  const wedding = /wedding/i.test(event.eventType || '')
  const isoTimes = useMemo(() => (wedding ? times.map((t) => (t.date ? toIso(`${t.date}T${t.time}`) : '')).filter(Boolean) : []), [times, wedding])
  const setTime = (i, patch) => setTimes(times.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const mail = useMemo(
    () =>
      template ? appendSignature(renderQuoteEmail({ template: { ...template, subject, body }, event, quote: event.quote, times: isoTimes }), signature) : null,
    [template, signature, subject, body, event, isoTimes]
  )

  const to = emailOf(event.email)
  // Anything the email depends on that isn't saved yet (or a brand-new event).
  const dirty = !id || sentFields(event) !== sentFields(initial)
  const picked = event.tasting && event.tasting.picked
  const offered = (event.tasting && event.tasting.offered) || []
  const status = picked ? (
    <p className="text-sm text-green-800">Tasting booked: {tastingWhen(picked)}.</p>
  ) : offered.length ? (
    <p className="text-sm text-gray-600">Tasting times offered: {offered.map((t) => tastingWhen(t, { short: true })).join(', ')}. Waiting for them to pick.</p>
  ) : null
  const blocked = !event.quote ? 'Build the quote first.' : !to ? 'Add their email address to send it.' : ''

  const openComposer = async () => {
    setError('')
    if (dirty) {
      setBusy(true)
      const saved = await onSave()
      setBusy(false)
      if (!saved) return
    }
    setOpen(true)
  }

  const past = isoTimes.some((t) => new Date(t).getTime() <= Date.now())
  const send = async () => {
    setBusy(true)
    setError('')
    try {
      // Changed something while the email was open: save that first.
      const eventId = dirty ? await onSave() : id
      if (!eventId) {
        setBusy(false)
        return
      }
      await httpsCallable(getFunctions(), 'sendQuoteEmail')({ eventId, subject: mail.subject, text: mail.text, html: mail.html, times: isoTimes })
      onSent(to)
    } catch (e) {
      setError(e.message || "Couldn't send it.")
      setBusy(false)
    }
  }

  return (
    <section className="space-y-2">
      <h3 className="font-semibold">Email the quote</h3>
      {status}
      {blocked ? (
        <p className="text-sm text-gray-600">{blocked}</p>
      ) : !open ? (
        <div className="flex items-center gap-3 flex-wrap">
          <button type="button" className={ui.btnPrimary} disabled={busy} onClick={openComposer}>
            {busy ? 'Saving…' : event.quoteEmailedAt ? 'Email the quote again…' : 'Email the quote…'}
          </button>
          {dirty && !busy && <span className="text-xs text-gray-500">Saves your changes first.</span>}
          {error && <span className="text-sm text-red-700">{error}</span>}
        </div>
      ) : !mail ? (
        <p className="text-sm text-gray-500">{error || 'Loading…'}</p>
      ) : (
        <div className="space-y-3 border border-gray-200 rounded-md p-3 bg-gray-50">
          <p className="text-sm text-gray-700">
            To <b>{to}</b>, from your business Gmail. Their reply comes to you.
          </p>
          <label className="block text-sm">
            <span className="text-gray-700">Subject</span>
            <input className={`${ui.input} mt-1`} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700">Message (just for this email; the usual wording is under Emails). Your signature is added below it.</span>
            <textarea className={`${ui.input} mt-1 font-mono`} rows={12} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
          <p className="text-xs text-gray-500">
            <code>{'{quote}'}</code> is the quote{wedding ? <> and <code>{'{tasting}'}</code> the tasting invite (only when you add times below)</> : ''}.
          </p>

          {wedding && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-800">Tasting times to offer (free tasting, weddings only)</p>
            {times.map((t, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="date" aria-label={`Tasting ${i + 1} date`} className={ui.input} value={t.date} onChange={(e) => setTime(i, { date: e.target.value })} />
                <select aria-label={`Tasting ${i + 1} time`} className={`${ui.input} w-32 shrink-0`} value={t.time} onChange={(e) => setTime(i, { time: e.target.value })}>
                  {TASTING_CLOCK.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <button type="button" aria-label="Remove this time" className="text-gray-400 hover:text-red-700" onClick={() => setTimes(times.length > 1 ? times.filter((_, j) => j !== i) : [blankTime()])}>
                  ✕
                </button>
              </div>
            ))}
            {/* A new row starts at the last row's time (5 pm the first time). */}
            <button type="button" className={ui.btnQuiet} onClick={() => setTimes([...times, blankTime(times[times.length - 1].time)])}>
              + Add a time
            </button>
            {past && <p className="text-sm text-red-700">One of the times has already passed.</p>}
          </div>
          )}

          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-800">Preview</p>
            <div className="border border-gray-200 rounded-md p-4 bg-white text-sm text-gray-800">
              <p className="text-gray-500">
                Subject: <span className="text-gray-900 font-semibold">{mail.subject}</span>
              </p>
              <hr className="my-3" />
              <style>{'.email-preview p{margin:0 0 12px}.email-preview ul{list-style:disc;padding-left:20px}.email-preview a{text-decoration:underline}'}</style>
              <div className="email-preview" dangerouslySetInnerHTML={{ __html: mail.html.replace(/\{\{TASTING_\d+\}\}/g, '#') }} />
            </div>
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button type="button" className={ui.btnPrimary} disabled={busy || past || !subject.trim()} onClick={send}>
              {busy ? 'Sending…' : `Send to ${to}`}
            </button>
            <button type="button" className={ui.btnQuiet} disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default QuoteEmail
