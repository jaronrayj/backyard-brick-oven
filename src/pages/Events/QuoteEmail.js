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

const emailOf = (v) => (/[^\s/<>,;]+@[^\s/<>,;]+\.[^\s/<>,;]+/.exec(String(v || '')) || [''])[0]
// What the quote email depends on; any unsaved change to these means Save first.
const sentFields = (e) => JSON.stringify([e.name, e.email, e.eventType, e.date, e.quote])
// datetime-local value ("2026-11-17T19:00") -> ISO, in this device's time zone (Utah).
const toIso = (v) => {
  const d = new Date(v)
  return v && !Number.isNaN(d.getTime()) ? d.toISOString() : ''
}

const QuoteEmail = ({ id, event, initial, onSent }) => {
  const [open, setOpen] = useState(false)
  const [template, setTemplate] = useState(null)
  const [signature, setSignature] = useState(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [times, setTimes] = useState([''])
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
  const isoTimes = useMemo(() => (wedding ? times.map(toIso).filter(Boolean) : []), [times, wedding])
  const mail = useMemo(
    () =>
      template ? appendSignature(renderQuoteEmail({ template: { ...template, subject, body }, event, quote: event.quote, times: isoTimes }), signature) : null,
    [template, signature, subject, body, event, isoTimes]
  )

  if (!id) return null
  const to = emailOf(event.email)
  const picked = event.tasting && event.tasting.picked
  const offered = (event.tasting && event.tasting.offered) || []
  const status = picked ? (
    <p className="text-sm text-green-800">Tasting booked: {tastingWhen(picked)}.</p>
  ) : offered.length ? (
    <p className="text-sm text-gray-600">Tasting times offered: {offered.map((t) => tastingWhen(t, { short: true })).join(', ')}. Waiting for them to pick.</p>
  ) : null
  const blocked = !event.quote
    ? 'Build the quote first.'
    : !to
    ? 'Add their email address (and Save) to send it.'
    : sentFields(event) !== sentFields(initial)
    ? 'Save your changes first, then email the quote.'
    : ''

  const past = isoTimes.some((t) => new Date(t).getTime() <= Date.now())
  const send = async () => {
    setBusy(true)
    setError('')
    try {
      await httpsCallable(getFunctions(), 'sendQuoteEmail')({ eventId: id, subject: mail.subject, text: mail.text, html: mail.html, times: isoTimes })
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
        <button type="button" className={ui.btnPrimary} onClick={() => setOpen(true)}>
          {event.quoteEmailedAt ? 'Email the quote again…' : 'Email the quote…'}
        </button>
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
            {times.map((v, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="datetime-local" className={ui.input} value={v} onChange={(e) => setTimes(times.map((x, j) => (j === i ? e.target.value : x)))} />
                <button type="button" aria-label="Remove this time" className="text-gray-400 hover:text-red-700" onClick={() => setTimes(times.length > 1 ? times.filter((_, j) => j !== i) : [''])}>
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className={ui.btnQuiet} onClick={() => setTimes([...times, ''])}>
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
