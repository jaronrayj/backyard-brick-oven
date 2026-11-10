import React, { useState } from 'react'
import { ui } from '../../components/TeamPage'
import { prettyDate } from './quote'
import { toMillis } from './history'
import { REVIEW_HOUR, reviewEmail, reviewSendDate, reviewState } from './reviewAskText'

// Review email panel in the event editor: when the thank-you + Google review
// email goes out (9 am the day after a booked event), exactly what it says,
// and Don't send. The email itself is sent by functions/reviewAsk.js.
const hour = `${REVIEW_HOUR > 12 ? REVIEW_HOUR - 12 : REVIEW_HOUR} ${REVIEW_HOUR >= 12 ? 'pm' : 'am'}`

const ReviewAsk = ({ event, isNew, onSkip }) => {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const state = reviewState(event)
  if (isNew || state === 'notBooked') return null
  const mail = reviewEmail(event)
  const on = reviewSendDate(event.date)
  const sentAt = event.reviewAsk && toMillis(event.reviewAsk.sentAt)

  const toggle = async (skip) => {
    setBusy(true)
    try {
      await onSkip(skip)
    } finally {
      setBusy(false)
    }
  }

  const line = {
    sent: `Sent${sentAt ? ` ${new Date(sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''} to ${(event.reviewAsk && event.reviewAsk.to) || mail.to}.`,
    skipped: "Won't be sent.",
    noEmail: `No email on file, so nothing goes out. The morning after, you'll get a reminder to text them the review link instead.`,
    waiting: on ? `Goes out ${prettyDate(on)} at ${hour} to ${mail.to}.` : `Goes out at ${hour} the day after the event, once it has a date.`,
  }[state]

  return (
    <section className="space-y-2">
      <h3 className="font-semibold">Review email</h3>
      <div className={`rounded-md p-3 space-y-2 ${state === 'waiting' ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
        <p className="text-sm text-gray-700">{line}</p>
        {state !== 'noEmail' && (
          <button type="button" className="text-sm underline text-gray-700" onClick={() => setOpen(!open)} aria-expanded={open}>
            {open ? 'Hide the email' : 'See the email'}
          </button>
        )}
        {open && state !== 'noEmail' && (
          <div className="text-sm text-gray-700 bg-white border border-gray-200 rounded-md p-3">
            <p className="font-semibold mb-2">{mail.subject}</p>
            <p className="whitespace-pre-wrap">{mail.text}</p>
          </div>
        )}
        {state === 'waiting' && (
          <button type="button" className={ui.btnQuiet} disabled={busy} onClick={() => toggle(true)}>
            Don't send
          </button>
        )}
        {state === 'skipped' && (
          <button type="button" className={ui.btnQuiet} disabled={busy} onClick={() => toggle(false)}>
            Send it after all
          </button>
        )}
      </div>
    </section>
  )
}

export default ReviewAsk
