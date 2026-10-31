import React, { useEffect, useRef, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { auth, db, signInWithGoogle } from '../../utils/firebase'
import { mountPlanner } from './planner'
import './planner.css'

// The planner keeps three Firestore documents under `planner/`:
//   ref    - recipe, menu, toppings, sauces, settings, recent Pizza Fridays (written by the Cloud Function)
//   plan   - services, picked pizzas, counts, tweaks (staff edit)
//   checks - shopping and prep checkmarks (staff edit)
// Who may use it lives in `plannerAccess/team`: { admins: [emails], staff: [emails] }.
const DOCS = { 'ref/snapshot': 'ref', 'plan/current': 'plan', 'plan/checks': 'checks' }

const store = {
  doc: (path) => {
    const ref = doc(db, 'planner', DOCS[path])
    return {
      set: (data) => setDoc(ref, data),
      onSnapshot: (next, error) =>
        onSnapshot(
          ref,
          (snap) => next({ exists: snap.exists(), data: () => snap.data(), metadata: snap.metadata }),
          error
        ),
    }
  },
}

const refresh = async () => {
  const call = httpsCallable(getFunctions(), 'refreshPlannerData')
  await call()
}

const Message = ({ children }) => (
  <div className="bybo-planner">
    <div className="wrap">
      <h1>Dough planner</h1>
      {children}
    </div>
  </div>
)

const Planner = () => {
  const [user, loading] = useAuthState(auth)
  const [access, setAccess] = useState(null) // null while checking, 'denied', or { admin }
  const rootRef = useRef(null)

  useEffect(() => {
    if (!user) {
      setAccess(null)
      return
    }
    const email = (user.email || '').toLowerCase()
    getDoc(doc(db, 'plannerAccess', 'team'))
      .then((snap) => {
        const data = snap.data() || {}
        const list = (key) => (data[key] || []).map((e) => String(e).toLowerCase())
        const admin = list('admins').includes(email)
        setAccess(admin || list('staff').includes(email) ? { admin } : 'denied')
      })
      .catch(() => setAccess('denied'))
  }, [user])

  useEffect(() => {
    if (!access || access === 'denied' || !rootRef.current) return undefined
    return mountPlanner(rootRef.current, { store, canWrite: true, isAdmin: access.admin, refresh })
  }, [access])

  if (loading || (user && !access)) {
    return <Message><p className="note">Loading…</p></Message>
  }
  if (!user) {
    return (
      <Message>
        <p className="note">Sign in with the Google account Jaron added to the planner.</p>
        <div className="row">
          <button type="button" className="btn primary" onClick={signInWithGoogle}>
            Sign in with Google
          </button>
        </div>
      </Message>
    )
  }
  if (access === 'denied') {
    return (
      <Message>
        <p className="note">
          {user.email} isn't on the planner list yet. Ask Jaron to add it, then reload this page.
        </p>
      </Message>
    )
  }
  return <div className="bybo-planner" ref={rootRef} />
}

export default Planner
