import React, { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../utils/db'
import { signInWithGoogle } from '../../utils/firebase'
import useEventAdmin from '../Events/useEventAdmin'
import { PageHeader, TeamPage, ui } from '../../components/TeamPage'
import { signupsCsv } from './csv'

// /admin/signups: everyone who joined the email list on /hello (the poster QR
// code), newest first, with a CSV download for an email tool. Written only by
// the sendSignup function (functions/signup.js); admins can read it.

const shortDate = (t) => {
  const d = t && typeof t.toDate === 'function' ? t.toDate() : null
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
}

const download = (rows) => {
  const blob = new Blob([signupsCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bybo-email-list-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const List = () => {
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
  return (
    <>
      <PageHeader title="Email list" sub="Sign-ups from the poster page, backyardbrickovenpizza.com/hello">
        <button type="button" className={ui.btnQuiet} disabled={!rows || !rows.length} onClick={() => download(rows)}>
          Download CSV
        </button>
      </PageHeader>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!rows && !error && <p className="text-gray-500">Loading…</p>}
      {rows && <p className="text-sm text-gray-700">{rows.length} {rows.length === 1 ? 'person' : 'people'}</p>}
      {rows && rows.length === 0 && <p className={`${ui.card} text-gray-500`}>No sign-ups yet.</p>}
      {rows && rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className={`${ui.card} flex items-start justify-between gap-3`}>
              <div className="min-w-0">
                {r.name && <p className="font-semibold text-gray-900">{r.name}</p>}
                <a href={`mailto:${r.email}`} className="text-sm text-gray-700 underline break-all">{r.email}</a>
              </div>
              <p className="text-xs text-gray-500 shrink-0">{shortDate(r.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

const Signups = () => {
  const { user, loading, access } = useEventAdmin()
  if (loading) return <TeamPage><p className="text-gray-500">Loading…</p></TeamPage>
  if (!user) {
    return (
      <TeamPage>
        <PageHeader title="Email list" />
        <button type="button" className={ui.btnPrimary} onClick={signInWithGoogle}>Sign in with Google</button>
      </TeamPage>
    )
  }
  if (access !== true) {
    return <TeamPage><PageHeader title="Email list" /><p className="text-gray-700">This page is for admins.</p></TeamPage>
  }
  return <TeamPage><List /></TeamPage>
}

export default Signups
