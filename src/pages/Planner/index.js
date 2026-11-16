import React, { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { onTabHome } from '../../utils/tabHome'
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
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

// Crew sign-ups ("I'm planning to come"): crewSignups/{serviceId}__{uid}, kept
// apart from the plan so they never collide with an admin's edits.
const crewSignups = (getMe) => ({
  listen: (next) =>
    onSnapshot(
      collection(db, 'crewSignups'),
      (snap) => next(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => next([])
    ),
  save: (svc, { from, to }) => {
    const me = getMe()
    if (!me) return Promise.reject(new Error('Still signing in'))
    return setDoc(doc(db, 'crewSignups', `${svc.id}__${me.uid}`), { serviceId: svc.id, date: svc.date || '', uid: me.uid, name: me.name, from, to, at: serverTimestamp() })
  },
  remove: (id) => deleteDoc(doc(db, 'crewSignups', id)),
})
// "Ben" from the Google name, or the email before the @.
const firstNameOf = (user) => String((user && user.displayName) || '').trim().split(/\s+/)[0] || String((user && user.email) || '').split('@')[0]

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
  // Who's signed in, for crew sign-ups. Kept in a ref so the Planner mounts once
  // (it used to mount a second time when the sign-in finished restoring).
  const meRef = useRef(null)
  const meKey = user && !user.pending ? user.uid : null
  useEffect(() => {
    meRef.current = meKey ? { uid: user.uid, name: firstNameOf(user).slice(0, 60) } : null
    if (rootRef.current && rootRef.current.plannerRedrawCrew) rootRef.current.plannerRedrawCrew()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meKey])
  const [awakeSlot, setAwakeSlot] = useState(null)
  const [wrapSlot, setWrapSlot] = useState(null)
  // The wrap-up form reads the money tracker sheet, so it loads only once the Wrap up tab is opened.
  const [wrapOpened, setWrapOpened] = useState(false)

  useEffect(() => {
    if ((access !== 'admin' && access !== 'staff') || !rootRef.current) return undefined
    const root = rootRef.current
    const onTab = (e) => e.detail === 'wrapup' && setWrapOpened(true)
    root.addEventListener('planner-tab', onTab)
    const unmount = mountPlanner(rootRef.current, { store, canWrite: access === 'admin', canCheck: true, shopping: access === 'admin', isAdmin: access === 'admin', refresh, calendar, pizzas,
      me: () => meRef.current, signups: crewSignups(() => meRef.current),
      wrapUps: access === 'admin' ? wrapUps : null,
    })
    setAwakeSlot(rootRef.current.querySelector('#keep-awake-slot'))
    if (access === 'admin') setWrapSlot(rootRef.current.querySelector('#wrapup-slot'))
    return () => {
      root.removeEventListener('planner-tab', onTab)
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
        wrapOpened &&
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
