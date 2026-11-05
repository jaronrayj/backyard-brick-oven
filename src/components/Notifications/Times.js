import React, { useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../utils/db'
import { ui } from '../TeamPage'
import { DEFAULT_REMINDERS, TIME_CHOICES } from '../../pages/Events/schedule'

// Notification times, opened from the bell: Firestore eventSettings/reminders
// (read by functions/events.js and functions/push.js). Saves with merge, so
// the server's own fields (morningSentOn) are left alone.
const Times = ({ onClose }) => {
  const [r, setR] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getDoc(doc(db, 'eventSettings', 'reminders'))
      .then((snap) => {
        const d = { ...DEFAULT_REMINDERS, ...(snap.exists() ? snap.data() : {}) }
        setR({ ...d, emailsText: (d.emails || []).join(', ') })
      })
      .catch(() => setError("Couldn't load the notification times."))
  }, [])

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      const emails = r.emailsText
        .split(/[\s,]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
      await setDoc(doc(db, 'eventSettings', 'reminders'), { emails, doughTime: r.doughTime, morningTime: r.morningTime, wrapUpTime: r.wrapUpTime }, { merge: true })
      onClose('Notification times saved.')
    } catch (e) {
      console.error(e)
      setError("Couldn't save the notification times.")
      setBusy(false)
    }
  }

  const select = (key) => (
    <select className={ui.input} value={r[key]} onChange={(e) => setR({ ...r, [key]: e.target.value })}>
      {TIME_CHOICES.map((t) => (
        <option key={t.hm} value={t.hm}>
          {t.label}
        </option>
      ))}
    </select>
  )

  return (
    <div className="absolute right-0 top-full mt-1 z-30 w-72 max-w-[calc(100vw-2rem)] rounded-lg bg-white border border-gray-200 shadow-lg p-3 text-sm text-left space-y-3">
      <h3 className="font-semibold text-gray-900">Notification times</h3>
      {!r ? (
        <p className="text-gray-500">{error || 'Loading…'}</p>
      ) : (
        <>
          <label className="block text-gray-700">
            Morning summary
            {select('morningTime')}
            <span className="block text-xs text-gray-500">Today's calendar, dough steps and events. Skipped on empty days.</span>
          </label>
          <label className="block text-gray-700">
            Dough reminders
            {select('doughTime')}
            <span className="block text-xs text-gray-500">Poolish and mix days for booked events, with an email too.</span>
          </label>
          <label className="block text-gray-700">
            Wrap-up reminder for all-day entries
            {select('wrapUpTime')}
            <span className="block text-xs text-gray-500">Timed events remind you when they end on the calendar.</span>
          </label>
          <label className="block text-gray-700">
            Email dough reminders to
            <input
              className={ui.input}
              value={r.emailsText}
              placeholder="blank = the business inbox"
              onChange={(e) => setR({ ...r, emailsText: e.target.value })}
            />
          </label>
          <p className="text-xs text-gray-500">Utah time; can be up to 15 minutes late.</p>
          {error && <p className="text-red-700">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" className={ui.btnQuiet} onClick={() => onClose()}>
              Cancel
            </button>
            <button type="button" className={ui.btnPrimary} disabled={busy} onClick={save}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default Times
