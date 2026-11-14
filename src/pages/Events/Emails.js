import React, { useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../utils/db'
import { ui } from '../../components/TeamPage'
import {
  DEFAULT_AUTO_REPLY,
  DEFAULT_QUOTE_EMAIL,
  DEFAULT_TASTING,
  PLACEHOLDERS,
  QUOTE_PLACEHOLDERS,
  TASTING_PLACEHOLDERS,
  renderAutoReply,
  renderTastingEmail,
} from './replyText'
import { renderQuoteEmail } from './quoteEmailText'

// Events > Emails: the wording of every email the app sends for you, each with
// a live preview. Saved in eventSettings/emails (admins only):
//   autoReply   - functions/autoReply.js, when an inquiry comes in
//   quoteEmail  - the event editor's "Email the quote" (QuoteEmail.js)
//   tasting     - place, minutes, confirm and reminder (functions/tasting.js)

// Made-up inquiries for the previews.
const SAMPLES = {
  Wedding: {
    name: 'Kate and Ryan',
    eventType: 'Wedding',
    weddingPart: 'Reception',
    date: '2027-06-12',
    time: '6:00 pm',
    location: 'Bountiful, UT',
    guestsAsked: '85',
    addOns: ['Salad', 'Dessert'],
    comments: "We'd love a gluten-free option.",
    quote: {
      lines: [
        { label: 'Wedding package (up to 100 guests)', qty: 1, price: 1500 },
        { label: 'Salad', qty: 85, price: 3 },
      ],
      discount: 0,
      taxRate: 7.25,
      depositPct: 25,
      footer: '',
    },
  },
  Party: {
    name: 'Mike Taylor',
    eventType: 'Birthday or family party',
    date: '2027-03-20',
    time: '5pm',
    location: 'Centerville',
    guestsAsked: '40',
    addOns: [],
    comments: '',
    quote: { lines: [{ label: 'Party package (25 guests)', qty: 1, price: 375 }, { label: 'Extra guests', qty: 15, price: 15 }], discount: 0, taxRate: 7.25, depositPct: 25, footer: '' },
  },
}

// Two evenings next week at 7 pm, for the preview's tasting buttons.
const sampleTimes = () => {
  const out = []
  const d = new Date()
  d.setHours(19, 0, 0, 0)
  while (out.length < 2) {
    d.setDate(d.getDate() + 1)
    if ([2, 4].includes(d.getDay())) out.push(d.toISOString())
  }
  return out
}

const Preview = ({ mail }) => (
  <div className="border border-gray-200 rounded-md p-4 bg-white text-sm text-gray-800">
    <p className="text-gray-500">
      Subject: <span className="text-gray-900 font-semibold">{mail.subject}</span>
    </p>
    <hr className="my-3" />
    <div className="email-preview" dangerouslySetInnerHTML={{ __html: mail.html.replace(/\{\{TASTING_\d+\}\}/g, '#') }} />
  </div>
)

const Placeholders = ({ list }) => (
  <div className="text-xs text-gray-600 space-y-0.5">
    <p>These fill in for each email:</p>
    {list.map(([k, v]) => (
      <p key={k}>
        <code className="bg-gray-100 px-1 rounded">{k}</code> {v}
      </p>
    ))}
  </div>
)

const Text = ({ label, value, onChange, rows }) => (
  <label className="block text-sm">
    <span className="text-gray-700">{label}</span>
    {rows ? (
      <textarea className={`${ui.input} mt-1 font-mono`} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <input className={`${ui.input} mt-1`} value={value} onChange={(e) => onChange(e.target.value)} />
    )}
  </label>
)

const Section = ({ title, sub, children }) => (
  <section className="space-y-3 border-t border-gray-200 pt-5 first:border-0 first:pt-0">
    <div>
      <h3 className="font-semibold text-lg">{title}</h3>
      {sub && <p className="text-sm text-gray-600">{sub}</p>}
    </div>
    {children}
  </section>
)

const Reset = ({ onClick }) => (
  <button type="button" className="text-sm underline text-gray-600" onClick={onClick}>
    Start over from the original wording
  </button>
)

const Emails = ({ onClose }) => {
  const [s, setS] = useState(null)
  const [sample, setSample] = useState('Wedding')
  const [times] = useState(sampleTimes)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getDoc(doc(db, 'eventSettings', 'emails'))
      .then((snap) => {
        const d = (snap.exists() && snap.data()) || {}
        const t = d.tasting || {}
        setS({
          autoReply: { ...DEFAULT_AUTO_REPLY, ...(d.autoReply || {}) },
          quoteEmail: { ...DEFAULT_QUOTE_EMAIL, ...(d.quoteEmail || {}) },
          tasting: {
            ...DEFAULT_TASTING,
            ...t,
            confirm: { ...DEFAULT_TASTING.confirm, ...(t.confirm || {}) },
            reminder: { ...DEFAULT_TASTING.reminder, ...(t.reminder || {}) },
          },
        })
      })
      .catch(() => setError("Couldn't load the emails."))
  }, [])

  if (!s) return <div className={ui.card}>{error || 'Loading…'}</div>

  const setPart = (part, patch) => setS({ ...s, [part]: { ...s[part], ...patch } })
  const setTasting = (key, patch) => setS({ ...s, tasting: { ...s.tasting, [key]: { ...s.tasting[key], ...patch } } })
  const ev = SAMPLES[sample]
  const tastingSample = { name: 'Kate and Ryan', at: times[0], place: s.tasting.place, minutes: s.tasting.minutes }

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      const minutes = Math.max(15, Math.min(240, Number(s.tasting.minutes) || 60))
      await setDoc(
        doc(db, 'eventSettings', 'emails'),
        {
          autoReply: { on: !!s.autoReply.on, subject: s.autoReply.subject, body: s.autoReply.body },
          quoteEmail: { subject: s.quoteEmail.subject, body: s.quoteEmail.body, tasting: s.quoteEmail.tasting },
          tasting: { place: s.tasting.place.trim(), minutes, confirm: s.tasting.confirm, reminder: s.tasting.reminder },
        },
        { merge: true }
      )
      onClose()
    } catch (e) {
      console.error(e)
      setError("Couldn't save.")
      setBusy(false)
    }
  }

  return (
    <div className={`${ui.card} sm:p-6 space-y-5`}>
      <style>{'.email-preview p{margin:0 0 12px}.email-preview ul{list-style:disc;padding-left:20px}.email-preview a{text-decoration:underline}'}</style>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Emails</h2>
          <p className="text-sm text-gray-600">Sent from your business Gmail. Replies come to you.</p>
        </div>
        <div className="flex gap-1" role="group" aria-label="Previews for">
          {Object.keys(SAMPLES).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={sample === k}
              onClick={() => setSample(k)}
              className={`${ui.btn} ${sample === k ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-300 text-gray-700'}`}
            >
              {k} preview
            </button>
          ))}
        </div>
      </div>

      <Section title="Automatic reply to inquiries" sub="A minute after someone sends the inquiry form with an email address.">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-amber-600" checked={!!s.autoReply.on} onChange={(e) => setPart('autoReply', { on: e.target.checked })} />
          Send it
        </label>
        <Text label="Subject" value={s.autoReply.subject} onChange={(v) => setPart('autoReply', { subject: v })} />
        <Text label="Message" rows={14} value={s.autoReply.body} onChange={(v) => setPart('autoReply', { body: v })} />
        <Placeholders list={PLACEHOLDERS} />
        <Reset onClick={() => setPart('autoReply', { subject: DEFAULT_AUTO_REPLY.subject, body: DEFAULT_AUTO_REPLY.body })} />
        <Preview mail={renderAutoReply(s.autoReply, ev)} />
        {!s.autoReply.on && <p className="text-sm text-amber-700">Turned off: nothing is sent.</p>}
      </Section>

      <Section title="Quote email" sub="What “Email the quote” starts with in an event. You can still change it for each email before sending.">
        <Text label="Subject" value={s.quoteEmail.subject} onChange={(v) => setPart('quoteEmail', { subject: v })} />
        <Text label="Message" rows={13} value={s.quoteEmail.body} onChange={(v) => setPart('quoteEmail', { body: v })} />
        <Placeholders list={QUOTE_PLACEHOLDERS} />
        <Text label="Tasting invite (only when you offer tasting times; {times} becomes a button per time)" rows={5} value={s.quoteEmail.tasting} onChange={(v) => setPart('quoteEmail', { tasting: v })} />
        <Reset onClick={() => setPart('quoteEmail', { ...DEFAULT_QUOTE_EMAIL })} />
        <Preview mail={renderQuoteEmail({ template: s.quoteEmail, event: ev, quote: ev.quote, times: sample === 'Wedding' ? times : [] })} />
      </Section>

      <Section title="Tastings" sub="When they pick a time from the quote email, and the day before at 9 am.">
        <div className="grid sm:grid-cols-[1fr_8rem] gap-3">
          <Text label="Where tastings happen (only in these two emails)" value={s.tasting.place} onChange={(v) => setS({ ...s, tasting: { ...s.tasting, place: v } })} />
          <label className="block text-sm">
            <span className="text-gray-700">Length (minutes)</span>
            <input type="number" min="15" max="240" step="15" className={`${ui.input} mt-1`} value={s.tasting.minutes} onChange={(e) => setS({ ...s, tasting: { ...s.tasting, minutes: e.target.value } })} />
          </label>
        </div>
        {!s.tasting.place.trim() && <p className="text-sm text-amber-700">Add the address so the confirmation says where to go.</p>}
        <Placeholders list={TASTING_PLACEHOLDERS} />
        <h4 className="font-semibold">Confirmation</h4>
        <Text label="Subject" value={s.tasting.confirm.subject} onChange={(v) => setTasting('confirm', { subject: v })} />
        <Text label="Message" rows={12} value={s.tasting.confirm.body} onChange={(v) => setTasting('confirm', { body: v })} />
        <Reset onClick={() => setTasting('confirm', { ...DEFAULT_TASTING.confirm })} />
        <Preview mail={renderTastingEmail(s.tasting.confirm, tastingSample)} />
        <h4 className="font-semibold">Reminder the day before</h4>
        <Text label="Subject" value={s.tasting.reminder.subject} onChange={(v) => setTasting('reminder', { subject: v })} />
        <Text label="Message" rows={10} value={s.tasting.reminder.body} onChange={(v) => setTasting('reminder', { body: v })} />
        <Reset onClick={() => setTasting('reminder', { ...DEFAULT_TASTING.reminder })} />
        <Preview mail={renderTastingEmail(s.tasting.reminder, tastingSample)} />
      </Section>

      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2 sticky bottom-0 bg-white py-3 border-t border-gray-200">
        <button type="button" className={ui.btnPrimary} disabled={busy} onClick={save}>
          Save
        </button>
        <button type="button" className={ui.btnQuiet} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default Emails
