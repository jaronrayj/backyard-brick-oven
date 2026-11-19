import React, { useEffect, useMemo, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../utils/db'
import { signInWithGoogle } from '../../utils/firebase'
import useEventAdmin from '../Events/useEventAdmin'
import { PageHeader, TeamPage, ui } from '../../components/TeamPage'

// /admin/crew: every crew answer ("I'm coming", "Maybe", "Can't make it") and
// sign-up from the Planner, newest first. Written by the crew themselves
// (crewHistory/{auto}, append-only; firestore.rules), so it's a true record of
// who said what and when. Admins only.

const ACTION_LABEL = {
  coming: 'Coming',
  maybe: 'Maybe',
  "can't make it": "Can't make it",
  'signed up': 'Signed up',
  'cancelled sign-up': 'Took back sign-up',
}
const TONE = {
  coming: 'text-green-700',
  'signed up': 'text-green-700',
  maybe: 'text-amber-700',
  "can't make it": 'text-red-700',
  'cancelled sign-up': 'text-red-700',
}

const when = (t) => {
  const d = t && typeof t.toDate === 'function' ? t.toDate() : null
  return d ? d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'just now'
}
const day = (iso) =>
  /^\d{4}-\d{2}-\d{2}$/.test(iso || '')
    ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
    : ''
const clock = (v) => {
  if (!/^\d{1,2}:\d{2}$/.test(String(v || ''))) return ''
  const [h, m] = v.split(':').map(Number)
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`
}

const List = () => {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [who, setWho] = useState('')
  useEffect(
    () =>
      onSnapshot(
        query(collection(db, 'crewHistory'), orderBy('at', 'desc'), limit(300)),
        (snap) => setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => setError(err.message || 'Could not load the crew history.')
      ),
    []
  )
  const people = useMemo(() => [...new Set((rows || []).map((r) => r.name).filter(Boolean))].sort(), [rows])
  const shown = (rows || []).filter((r) => !who || r.name === who)
  return (
    <>
      <PageHeader title="Crew history" sub="Every answer and sign-up your crew made on the Planner, newest first">
        {people.length > 1 && (
          <select
            id="crew-history-who"
            aria-label="Show one person"
            value={who}
            onChange={(e) => setWho(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Everyone</option>
            {people.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}
      </PageHeader>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!rows && !error && <p className="text-gray-500">Loading…</p>}
      {rows && shown.length === 0 && (
        <p className={`${ui.card} text-gray-500`}>
          Nothing yet. When crew answer Coming, Maybe or Can't make it on a service (or sign up for one), it shows here.
        </p>
      )}
      {shown.length > 0 && (
        <ul className="space-y-2">
          {shown.map((r) => {
            const shift = [clock(r.from), clock(r.to)].filter(Boolean).join('–')
            const what = [r.service, day(r.date)].filter(Boolean).join(', ')
            return (
              <li key={r.id} className={`${ui.card} flex items-start justify-between gap-3`}>
                <div className="min-w-0">
                  <p className="text-gray-900">
                    <span className="font-semibold">{r.name || r.email || 'Someone'}</span>{' '}
                    <span className={`font-semibold ${TONE[r.action] || ''}`}>{ACTION_LABEL[r.action] || r.action}</span>
                  </p>
                  {(what || shift) && <p className="text-sm text-gray-600">{[what, shift].filter(Boolean).join(' · ')}</p>}
                </div>
                <p className="text-xs text-gray-500 shrink-0">{when(r.at)}</p>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

const CrewHistory = () => {
  const { user, loading, access } = useEventAdmin()
  if (loading) return <TeamPage><p className="text-gray-500">Loading…</p></TeamPage>
  if (!user) {
    return (
      <TeamPage>
        <PageHeader title="Crew history" />
        <button type="button" className={ui.btnPrimary} onClick={signInWithGoogle}>Sign in with Google</button>
      </TeamPage>
    )
  }
  if (access !== true) {
    return <TeamPage><PageHeader title="Crew history" /><p className="text-gray-700">This page is for admins.</p></TeamPage>
  }
  return <TeamPage><List /></TeamPage>
}

export default CrewHistory
