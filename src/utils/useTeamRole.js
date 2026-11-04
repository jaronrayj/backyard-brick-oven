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

// Last role this browser saw, so team pages open at once on the next visit
// while the list is checked again in the background. Only the page layout
// trusts it; the data itself is still guarded by the database rules.
const ROLE_KEY = 'bybo-team-role'
const remembered = () => {
  try {
    return JSON.parse(localStorage.getItem(ROLE_KEY) || 'null')
  } catch (e) {
    return null
  }
}
const remember = (uid, email, role) => {
  try {
    if (role) localStorage.setItem(ROLE_KEY, JSON.stringify({ uid, email, role }))
    else localStorage.removeItem(ROLE_KEY)
  } catch (e) {
    /* storage blocked: just no head start next time */
  }
}

const useTeamRole = () => {
  const [user, authLoading] = useAuthState(auth)
  const [role, setRole] = useState(undefined) // undefined while checking
  const [cached] = useState(remembered)

  useEffect(() => {
    if (!user) {
      // Still restoring the sign-in: leave the role alone (no off-and-on flash).
      if (!authLoading) setRole(user === null ? null : undefined)
      return undefined
    }
    let cancelled = false
    const known = cached && cached.uid === user.uid ? cached.role : undefined
    setRole(known)
    const email = (user.email || '').toLowerCase()
    const fromList = user.emailVerified
      ? getDoc(doc(db, 'plannerAccess', 'team'))
          .then((snap) => listRole(snap.data(), email))
          .catch(() => null)
      : Promise.resolve(null)
    // Known on this browser: show the page now and sync the sign-in tag in
    // the background. First time: wait for the tag so the rules see it.
    const sync = syncTag(user)
    Promise.all([fromList, known ? null : sync]).then(([r]) => {
      remember(user.uid, user.email, r)
      if (!cancelled) setRole(r)
    })
    return () => {
      cancelled = true
    }
  }, [user, authLoading, cached])

  // Before Firebase has restored the sign-in, a remembered role can stand in.
  if (authLoading && cached) return { user: { uid: cached.uid, email: cached.email || '', pending: true }, loading: false, role: cached.role }
  // Right after sign-in restores, before the effect runs, keep the remembered
  // role so pages don't flash "loading" and set themselves up twice.
  const now = role === undefined && user && cached && cached.uid === user.uid ? cached.role : role
  return { user, loading: authLoading || (!!user && now === undefined), role: now || null }
}

export default useTeamRole
