import React from 'react'
import useEventAdmin from './useEventAdmin'
import { signInWithGoogle } from '../../utils/firebase'
import { PageHeader, TeamPage, ui } from '../../components/TeamPage'

// A team-home page for admins only (Report, Email templates): sign in, then the
// page, or "This page is for admins."
const AdminOnly = ({ title, children }) => {
  const { user, loading, access } = useEventAdmin()
  if (loading) return <TeamPage><p className="text-gray-500">Loading…</p></TeamPage>
  if (!user) {
    return (
      <TeamPage>
        <PageHeader title={title} />
        <button type="button" className={ui.btnPrimary} onClick={signInWithGoogle}>Sign in with Google</button>
      </TeamPage>
    )
  }
  if (access !== true) {
    return <TeamPage><PageHeader title={title} /><p className="text-gray-700">This page is for admins.</p></TeamPage>
  }
  return <TeamPage>{children}</TeamPage>
}

export default AdminOnly
