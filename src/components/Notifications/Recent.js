import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { db } from '../../utils/db'

// Recent notifications, opened from the bell: Firestore `notifications/`,
// which functions/push.js fills as it sends (kept 30 days). Tapping one goes
// where the notification goes.
const when = (at) =>
  at && at.toDate
    ? at.toDate().toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : ''

const Recent = ({ onClose }) => {
  const navigate = useNavigate()
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getDocs(query(collection(db, 'notifications'), orderBy('at', 'desc'), limit(50)))
      .then((snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => setError("Couldn't load recent notifications."))
  }, [])

  const go = (link) => {
    onClose()
    if (String(link || '').startsWith('/')) navigate(link)
  }

  return (
    <div className="absolute right-0 top-full mt-1 z-30 w-80 max-w-[calc(100vw-2rem)] rounded-lg bg-white border border-gray-200 shadow-lg p-3 text-sm text-left space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-900">Recent notifications</h3>
        <button type="button" className="text-xs underline text-gray-600" onClick={onClose}>
          Close
        </button>
      </div>
      {!items && <p className="text-gray-500">{error || 'Loading…'}</p>}
      {items && items.length === 0 && <p className="text-gray-500">Nothing in the last 30 days.</p>}
      {items && items.length > 0 && (
        <ul className="max-h-[60vh] overflow-y-auto -mx-1 space-y-1">
          {items.map((n) => (
            <li key={n.id}>
              <button type="button" className="w-full text-left rounded-md px-2 py-2 hover:bg-amber-50" onClick={() => go(n.link)}>
                <span className="flex justify-between gap-2">
                  <span className="font-medium text-gray-900">{n.title}</span>
                  <span className="text-xs text-gray-500 shrink-0">{when(n.at)}</span>
                </span>
                {n.body && <span className="block text-xs text-gray-600 whitespace-pre-line">{String(n.body).slice(0, 240)}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-500">Tap one to go where it points.</p>
    </div>
  )
}

export default Recent
