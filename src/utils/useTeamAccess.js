import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { doc, getDoc } from 'firebase/firestore'
import { get, ref } from 'firebase/database'
import { auth, db, rtdb } from './firebase'

// Which team tools the signed-in person can open. Mirrors the checks the
// pages themselves make (and the database rules enforce):
//   menu    - Realtime Database `menuAdmins/{email with '.' -> ','}` is true
//   planner - email is in Firestore `plannerAccess/team` admins or staff
//   admin   - email is in `plannerAccess/team` admins (business dashboard)
export const TEAM_TOOLS = [
  { key: 'menu', name: 'Menu manager', href: '/admin/menu', blurb: 'Edit the pizzas and photos on the website.' },
  { key: 'planner', name: 'Dough planner', href: '/planner', blurb: 'Plan dough, shopping and prep for upcoming services.' },
  {
    key: 'admin',
    name: 'Business dashboard',
    href: 'https://claude.ai/artifact/K9KEwBzUztUTbSTAroYikx',
    blurb: 'Opens on claude.ai. Each admin needs it shared with their account there.',
    external: true,
  },
]

const useTeamAccess = () => {
  const [user, authLoading] = useAuthState(auth)
  const [access, setAccess] = useState(null) // null while checking

  useEffect(() => {
    if (!user || !user.email) {
      setAccess(user === null ? { menu: false, planner: false, admin: false } : null)
      return undefined
    }
    let cancelled = false
    const email = user.email.toLowerCase()
    const menu = user.emailVerified
      ? get(ref(rtdb, `menuAdmins/${email.replace(/\./g, ',')}`))
          .then((snap) => snap.val() === true)
          .catch(() => false)
      : Promise.resolve(false)
    const planner = getDoc(doc(db, 'plannerAccess', 'team'))
      .then((snap) => {
        const data = snap.data() || {}
        const list = (key) => (data[key] || []).map((e) => String(e).toLowerCase())
        const admin = list('admins').includes(email)
        return { planner: admin || list('staff').includes(email), admin }
      })
      .catch(() => ({ planner: false, admin: false }))
    setAccess(null)
    Promise.all([menu, planner]).then(([m, p]) => {
      if (!cancelled) setAccess({ menu: m, ...p })
    })
    return () => {
      cancelled = true
    }
  }, [user])

  const tools = access ? TEAM_TOOLS.filter((t) => access[t.key]) : []
  return { user, loading: authLoading || (!!user && !access), tools }
}

export default useTeamAccess
