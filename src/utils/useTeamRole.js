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

// One sync per sign-in per page load, however many components ask. When this
// browser already knows the role and synced in the last 12 hours, it's skipped
// (a slow call on a phone signal); a role change on the list syncs right away.
const synced = new Map()
const SYNC_KEY = 'bybo-team-synced'
const SYNC_EVERY = 12 * 60 * 60 * 1000
const syncedRecently = (uid) => {
  try {
    const v = JSON.parse(localStorage.getItem(SYNC_KEY) || 'null')
    return !!v && v.uid === uid && Date.now() - v.at < SYNC_EVERY
  } catch (e) {
    return false
  }
}
const syncTag = (user) => {
  if (!synced.has(user.uid)) {
    synced.set(
      user.uid,
      httpsCallable(getFunctions(), 'refreshMyAccess')()
        .then((res) => {
          try {
            localStorage.setItem(SYNC_KEY, JSON.stringify({ uid: user.uid, at: Date.now() }))
          } catch (e) {
            // fine: it syncs again next time
          }
          return res.data && res.data.changed ? user.getIdToken(true) : null
        })
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

// "View as crew": an admin can see the team pages exactly as staff do. Only the
// pages change (role reads "staff"); the account keeps admin access, and the
// database rules still go by the real role. Remembered on this browser.
const VIEW_KEY = 'bybo-view-as'
let viewAs = (() => {
  try {
    return localStorage.getItem(VIEW_KEY) || ''
  } catch (e) {
    return ''
  }
})()
const viewers = new Set()
export const setViewAsCrew = (on) => {
  viewAs = on ? 'staff' : ''
  try {
    if (on) localStorage.setItem(VIEW_KEY, 'staff')
    else localStorage.removeItem(VIEW_KEY)
  } catch (e) {
    /* storage blocked: just for this visit */
  }
  viewers.forEach((f) => f(viewAs))
}
// { role, realRole, viewingAsCrew }: staff pages for an admin viewing as crew.
export const viewedRole = (role, view = viewAs) =>
  role === 'admin' && view === 'staff' ? { role: 'staff', realRole: 'admin', viewingAsCrew: true } : { role, realRole: role, viewingAsCrew: false }

const useTeamRole = () => {
  const [view, setView] = useState(viewAs)
  useEffect(() => {
    viewers.add(setView)
    return () => viewers.delete(setView)
  }, [])
  const result = useRealTeamRole()
  return { ...result, ...viewedRole(result.role, view) }
}

const useRealTeamRole = () => {
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
    // the background (twice a day). First time: wait for the tag so the rules see it.
    const sync = known && syncedRecently(user.uid) ? null : syncTag(user)
    Promise.all([fromList, known ? null : sync]).then(([r]) => {
      // The list says something different from what this browser knew: sync now.
      if (known && r !== known) syncTag(user)
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
