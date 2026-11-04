import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { doc, getDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { auth } from './firebase'
import { db } from './db'

// The one team list: Firestore `plannerAccess/team` ({ admins: [emails], staff: [emails] }).
// Admins: menu, planner, events, wrap-up, dashboard link. Staff: planner.
//
// The database rules check a `team` tag on the sign-in that the server copies
// from that list (functions/team.js). On load this asks the server to bring
// the tag up to date and, if it changed, refreshes the sign-in so the rules
// see it straight away. If that call fails, pages still open from the list.
const listRole = (data, email) => {
  const lower = (key) => ((data || {})[key] || []).map((e) => String(e).trim().toLowerCase())
  if (lower('admins').includes(email)) return 'admin'
  if (lower('staff').includes(email)) return 'staff'
  return null
}

// One sync per sign-in per page load, however many components ask.
const synced = new Map()
const syncTag = (user) => {
  if (!synced.has(user.uid)) {
    synced.set(
      user.uid,
      httpsCallable(getFunctions(), 'refreshMyAccess')()
        .then((res) => (res.data && res.data.changed ? user.getIdToken(true) : null))
        .catch(() => null)
    )
  }
  return synced.get(user.uid)
}

const useTeamRole = () => {
  const [user, authLoading] = useAuthState(auth)
  const [role, setRole] = useState(undefined) // undefined while checking

  useEffect(() => {
    if (!user) {
      setRole(user === null ? null : undefined)
      return undefined
    }
    let cancelled = false
    setRole(undefined)
    const email = (user.email || '').toLowerCase()
    const fromList = user.emailVerified
      ? getDoc(doc(db, 'plannerAccess', 'team'))
          .then((snap) => listRole(snap.data(), email))
          .catch(() => null)
      : Promise.resolve(null)
    Promise.all([fromList, syncTag(user)]).then(([r]) => {
      if (!cancelled) setRole(r)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  return { user, loading: authLoading || (!!user && role === undefined), role: role || null }
}

export default useTeamRole
