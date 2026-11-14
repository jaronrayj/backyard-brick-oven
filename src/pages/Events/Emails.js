import React, { useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../utils/db'
import { ui } from '../../components/TeamPage'
import { DEFAULT_AUTO_REPLY, PLACEHOLDERS, renderAutoReply } from './replyText'

// Events > Emails: the wording of emails the app sends for you, with a live
// preview. Saved in eventSettings/emails (admins only); functions/autoReply.js
// reads it when an inquiry comes in.

// Made-up inquiries for the preview.
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
  },
}

const Emails = ({ onClose }) => {
  const [reply, setReply] = useState(null)
  const [sample, setSample] = useState('Wedding')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getDoc(doc(db, 'eventSettings', 'emails'))
      .then((snap) => setReply({ ...DEFAULT_AUTO_REPLY, ...((snap.exists() && snap.data().autoReply) || {}) }))
      .catch(() => setError("Couldn't load the emails."))
  }, [])

  if (!reply) return <div className={ui.card}>{error || 'Loading…'}</div>

  const set = (patch) => setReply({ ...reply, ...patch })
  const preview = renderAutoReply(reply, SAMPLES[sample])
  const save = async () => {
    setBusy(true)
    setError('')
    try {
      await setDoc(doc(db, 'eventSettings', 'emails'), { autoReply: { on: !!reply.on, subject: reply.subject, body: reply.body } }, { merge: true })
      onClose()
    } catch (e) {
      console.error(e)
      setError("Couldn't save.")
      setBusy(false)
    }
  }

  return (
    <div className={`${ui.card} sm:p-6 space-y-5`}>
      <h2 className="text-xl font-bold">Emails</h2>

      <section className="space-y-3">
        <div>
          <h3 className="font-semibold">Automatic reply to inquiries</h3>
          <p className="text-sm text-gray-600">
            Sent from your business Gmail a minute after someone sends the inquiry form with an email address. Their replies come to
            you.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-amber-600" checked={!!reply.on} onChange={(e) => set({ on: e.target.checked })} />
          Send it
        </label>
        <label className="block text-sm">
          <span className="text-gray-700">Subject</span>
          <input className={`${ui.input} mt-1`} value={reply.subject} onChange={(e) => set({ subject: e.target.value })} />
        </label>
        <label className="block text-sm">
          <span className="text-gray-700">Message</span>
          <textarea className={`${ui.input} mt-1 font-mono`} rows={14} value={reply.body} onChange={(e) => set({ body: e.target.value })} />
        </label>
        <div className="text-xs text-gray-600 space-y-0.5">
          <p>These fill in for each inquiry:</p>
          {PLACEHOLDERS.map(([k, v]) => (
            <p key={k}>
              <code className="bg-gray-100 px-1 rounded">{k}</code> {v}
            </p>
          ))}
        </div>
        <button type="button" className="text-sm underline text-gray-600" onClick={() => set({ subject: DEFAULT_AUTO_REPLY.subject, body: DEFAULT_AUTO_REPLY.body })}>
          Start over from the original wording
        </button>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-semibold">Preview</h3>
          <div className="flex gap-1" role="group" aria-label="Preview for">
            {Object.keys(SAMPLES).map((k) => (
              <button key={k} type="button" aria-pressed={sample === k} onClick={() => setSample(k)} className={`${ui.btn} ${sample === k ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-300 text-gray-700'}`}>
                {k}
              </button>
            ))}
          </div>
        </div>
        <div className="border border-gray-200 rounded-md p-4 bg-white text-sm text-gray-800">
          <p className="text-gray-500">
            Subject: <span className="text-gray-900 font-semibold">{preview.subject}</span>
          </p>
          <hr className="my-3" />
          {/* The site's CSS resets paragraphs and lists; put email spacing back for the preview. */}
          <style>{'.email-preview p{margin:0 0 12px}.email-preview ul{list-style:disc;padding-left:20px;margin:0 0 12px}.email-preview a{text-decoration:underline}'}</style>
          <div className="email-preview" dangerouslySetInnerHTML={{ __html: preview.html }} />
        </div>
        {!reply.on && <p className="text-sm text-amber-700">Turned off: nothing is sent.</p>}
      </section>

      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
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
