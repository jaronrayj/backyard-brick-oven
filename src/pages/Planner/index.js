import React, { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { onTabHome } from '../../utils/tabHome'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { onValue, ref as rtdbRef } from 'firebase/database'
import { signInWithGoogle } from '../../utils/firebase'
import { db, rtdb } from '../../utils/db'
import useTeamRole from '../../utils/useTeamRole'
import { mountPlanner } from './planner'
import KeepAwake from '../../components/KeepAwake'
import './planner.css'

const WrapUp = lazy(() => import('../Events/WrapUp'))

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
      // Metadata changes too, so the Planner hears when a copy from this
      // device's cache is confirmed by the server (metadata.fromCache: false).
      onSnapshot: (next, error) =>
        onSnapshot(
          ref,
          { includeMetadataChanges: true },
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

// The website's pizzas (on and off the menu), live from the Realtime Database.
const pizzas = (next) => onValue(rtdbRef(rtdb, 'pizzas'), (snap) => next(snap.val()), () => {})

// The business calendar: the next two weeks for "From your calendar", or { from, to } for the Calendar tab.
const calendar = async (range) => (await httpsCallable(getFunctions(), 'plannerCalendar')(range || {})).data

// Admins only: how many recent events still need a wrap-up, for the Wrap up tab.
const wrapUps = {
  due: async () => (await httpsCallable(getFunctions(), 'wrapUpsDue')()).data,
}

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
  // Tapping the Planner tab again: back to the Plan tab (TeamNav scrolls to the top).
  useEffect(
    () =>
      onTabHome('planner', () => {
        const plan = rootRef.current && rootRef.current.querySelector('.tabs [data-tab="plan"]')
        if (plan) plan.click()
      }),
    []
  )
  const [awakeSlot, setAwakeSlot] = useState(null)
  const [wrapSlot, setWrapSlot] = useState(null)

  useEffect(() => {
    if ((access !== 'admin' && access !== 'staff') || !rootRef.current) return undefined
    const unmount = mountPlanner(rootRef.current, { store, canWrite: access === 'admin', canCheck: true, shopping: access === 'admin', isAdmin: access === 'admin', refresh, calendar, pizzas,
      wrapUps: access === 'admin' ? wrapUps : null,
    })
    setAwakeSlot(rootRef.current.querySelector('#keep-awake-slot'))
    if (access === 'admin') setWrapSlot(rootRef.current.querySelector('#wrapup-slot'))
    return () => {
      setAwakeSlot(null)
      setWrapSlot(null)
      unmount()
    }
  }, [access])

  // A notification tapped while the Planner is already open changes the link
  // (/planner#prep, say) without reloading: switch to that tab. On first load
  // planner.js reads the #tab itself.
  const location = useLocation()
  useEffect(() => {
    const tab = location.hash.slice(1)
    if (!rootRef.current || !/^[a-z]+$/.test(tab)) return
    const btn = rootRef.current.querySelector(`.tabs [data-tab="${tab}"]`)
    if (btn && !btn.hidden) btn.click()
  }, [location.key, location.hash, access])

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
      {wrapSlot &&
        createPortal(
          <Suspense fallback={<p className="note">Loading…</p>}>
            <WrapUp
              bare
              fromPlanner={(c) => (rootRef.current && rootRef.current.plannerWrapInfo ? rootRef.current.plannerWrapInfo(c) : null)}
              onChange={() => rootRef.current && rootRef.current.dispatchEvent(new Event('wrapups-changed'))}
            />
          </Suspense>,
          wrapSlot
        )}
    </>
  )
}

export default Planner
