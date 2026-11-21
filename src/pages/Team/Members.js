import React, { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db } from '../../utils/db'
import { ui } from '../../components/TeamPage'

// Team members (admins, on the team home): the one team list, Firestore
// plannerAccess/team { admins, staff }, read live. Changes go through the
// updateTeamList function (functions/team.js), which refuses removing yourself
// or the last admin; everyone's access then updates on its own. "Crew" is the
// list's `staff`.

const ROLES = [
  { key: 'staff', label: 'Crew' },
  { key: 'admin', label: 'Admin' },
]
const save = (change) => httpsCallable(getFunctions(), 'updateTeamList')(change)

const Members = ({ me }) => {
  const [team, setTeam] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('staff')

  useEffect(
    () =>
      onSnapshot(
        doc(db, 'plannerAccess', 'team'),
        (snap) => setTeam(snap.data() || { admins: [], staff: [] }),
        () => setError("Couldn't load the team list.")
      ),
    []
  )

  const run = async (key, change, after) => {
    setBusy(key)
    setError('')
    try {
      await save(change)
      if (after) after()
    } catch (e) {
      setError(e.message || "Couldn't save. Try again.")
    }
    setBusy('')
  }

  const add = (e) => {
    e.preventDefault()
    if (!email.trim()) return
    run('add', { action: 'set', email, role }, () => setEmail(''))
  }

  const rows = team
    ? [
        ...(team.admins || []).map((e) => ({ email: e, role: 'admin' })),
        ...(team.staff || []).map((e) => ({ email: e, role: 'staff' })),
      ]
    : []
  const mine = (e) => String(e).toLowerCase() === String(me || '').toLowerCase()

  return (
    <section className={`${ui.card} space-y-3`}>
      <div>
        <h2 className="font-semibold text-gray-900">Team members</h2>
        <p className="text-sm text-gray-500">
          Crew get the Planner; admins get everything. Each person needs a Google account with this email, then signs in at
          backyardbrickovenpizza.com/team.
        </p>
      </div>
      {!team && !error && <p className="text-gray-500">Loading…</p>}
      {team && (
        <ul className="divide-y divide-gray-100">
          {rows.map((r) => (
            <li key={r.email} className="flex items-center gap-2 py-2">
              <span className="flex-1 min-w-0 truncate text-gray-800">
                {r.email}
                {mine(r.email) && <span className="text-xs text-gray-500"> (you)</span>}
              </span>
              <select
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white"
                value={r.role}
                disabled={!!busy || mine(r.email)}
                aria-label={`Role for ${r.email}`}
                onChange={(e) => run(r.email, { action: 'set', email: r.email, role: e.target.value })}
              >
                {ROLES.map((x) => (
                  <option key={x.key} value={x.key}>
                    {x.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-red-700 underline disabled:opacity-40"
                disabled={!!busy || mine(r.email)}
                onClick={() => window.confirm(`Remove ${r.email} from the team?`) && run(r.email, { action: 'remove', email: r.email })}
              >
                {busy === r.email ? 'Saving…' : 'Remove'}
              </button>
            </li>
          ))}
          {rows.length === 0 && <li className="py-2 text-gray-500">Nobody on the list yet.</li>}
        </ul>
      )}
      <form onSubmit={add} className="flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3">
        <label className="flex-1 min-w-[12rem] text-xs text-gray-600">
          <span className="block mb-1">Add someone (their Google account email)</span>
          <input
            className={ui.input}
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <select
          className="border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white"
          value={role}
          aria-label="Role for the new person"
          onChange={(e) => setRole(e.target.value)}
        >
          {ROLES.map((x) => (
            <option key={x.key} value={x.key}>
              {x.label}
            </option>
          ))}
        </select>
        <button type="submit" className={ui.btnPrimary} disabled={!!busy || !email.trim()}>
          {busy === 'add' ? 'Adding…' : 'Add'}
        </button>
      </form>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </section>
  )
}

export default Members
