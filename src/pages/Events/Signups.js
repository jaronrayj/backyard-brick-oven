import React, { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../utils/db'
import { ui } from '../../components/TeamPage'
import { prettyPhone } from '../Hello/signupText'

// Events > Signups: everyone who joined the list on /hello (the poster QR
// code), newest first, with a CSV download. The list is written only by the
// sendSignup function (functions/signup.js); admins can read it.

const when = (t) => {
  const d = t && typeof t.toDate === 'function' ? t.toDate() : null
  return d
}
const shortDate = (d) => (d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '')

// One CSV cell: quoted when needed, and never starting like a spreadsheet formula.
const cell = (value) => {
  let s = String(value == null ? '' : value)
  if (/^[=+\-@]/.test(s) && !/^\+\d+$/.test(s)) s = `'${s}`
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const signupsCsv = (rows) => {
  const head = ['Name', 'Phone or email', 'Type', 'OK to text', 'Code', 'Signed up', 'Source']
  const lines = rows.map((r) => {
    const d = when(r.createdAt)
    return [r.name, r.contact, r.contactType, r.contactType === 'phone' ? (r.consent ? 'yes' : 'no') : '', r.code, d ? d.toISOString() : '', r.source]
      .map(cell)
      .join(',')
  })
  return [head.join(','), ...lines].join('\n') + '\n'
}

const download = (rows) => {
  const blob = new Blob([signupsCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bybo-signups-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const Signups = ({ onClose }) => {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  useEffect(
    () =>
      onSnapshot(
        query(collection(db, 'signups'), orderBy('createdAt', 'desc')),
        (snap) => setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => setError(err.message || 'Could not load sign-ups.')
      ),
    []
  )
  const counts = useMemo(() => {
    const list = rows || []
    return {
      all: list.length,
      texts: list.filter((r) => r.contactType === 'phone' && r.consent).length,
      emails: list.filter((r) => r.contactType === 'email').length,
    }
  }, [rows])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Signups</h1>
          <p className="text-sm text-gray-500 mt-0.5">From the poster page, backyardbrickovenpizza.com/hello</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={ui.btnQuiet} disabled={!rows || !rows.length} onClick={() => download(rows)}>
            Download CSV
          </button>
          <button type="button" className={ui.btnQuiet} onClick={onClose}>
            Done
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {!rows && !error && <p className="text-gray-500">Loading…</p>}
      {rows && (
        <p className="text-sm text-gray-700">
          {counts.all} {counts.all === 1 ? 'person' : 'people'} · {counts.texts} OK to text · {counts.emails} by email
        </p>
      )}
      {rows && rows.length === 0 && <p className={`${ui.card} text-gray-500`}>No sign-ups yet.</p>}
      {rows && rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className={`${ui.card} flex items-start justify-between gap-3`}>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{r.name}</p>
                <p className="text-sm text-gray-700 break-all">
                  {r.contactType === 'phone' ? (
                    <a href={`sms:${r.contact}`} className="underline">{prettyPhone(r.contact)}</a>
                  ) : (
                    <a href={`mailto:${r.contact}`} className="underline">{r.contact}</a>
                  )}
                  {r.contactType === 'phone' && (
                    <span className={`ml-2 text-xs ${r.consent ? 'text-green-700' : 'text-gray-500'}`}>
                      {r.consent ? 'OK to text' : 'no texts'}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-sm font-semibold text-amber-700">{r.code}</p>
                <p className="text-xs text-gray-500">{shortDate(when(r.createdAt))}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Signups
