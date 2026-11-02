import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db, signInWithGoogle } from '../../utils/firebase'
import useTeamRole from '../../utils/useTeamRole'
import { mountPlanner } from './planner'
import KeepAwake from '../../components/KeepAwake'
import './planner.css'

// The planner keeps three Firestore documents under `planner/`:
//   ref    - recipe, menu, toppings, sauces, settings, recent Pizza Fridays (written by the Cloud Function)
//   plan   - services, picked pizzas, counts, tweaks (staff edit)
//   checks - shopping and prep checkmarks (staff edit)
// Who may use it: the team list (useTeamRole), admins and staff.
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

// Upcoming entries on the business calendar, for "From your calendar".
const calendar = async () => (await httpsCallable(getFunctions(), 'plannerCalendar')()).data

const Message = ({ children }) => (
  <div className="bybo-planner">
    <div className="wrap">
      <h1>Planner</h1>
      {children}
    </div>
  </div>
)

const Planner = () => {
  const { user, loading, role } = useTeamRole()
  // 'loading', 'admin', 'staff' or 'denied'
  const access = loading || !user ? 'loading' : role || 'denied'
  const rootRef = useRef(null)
  const [awakeSlot, setAwakeSlot] = useState(null)

  useEffect(() => {
    if ((access !== 'admin' && access !== 'staff') || !rootRef.current) return undefined
    const unmount = mountPlanner(rootRef.current, { store, canWrite: true, isAdmin: access === 'admin', refresh, calendar })
    setAwakeSlot(rootRef.current.querySelector('#keep-awake-slot'))
    return () => {
      setAwakeSlot(null)
      unmount()
    }
  }, [access])

  if (loading) {
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
  return (
    <>
      <div className="bybo-planner" ref={rootRef} />
      {awakeSlot && createPortal(<KeepAwake bare className="btn quiet" />, awakeSlot)}
    </>
  )
}

export default Planner
