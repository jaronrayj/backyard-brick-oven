import { getApp } from 'firebase/app'
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics'
import { getFunctions, httpsCallable } from 'firebase/functions'

// Visitor tracking for the public site.
//
// Two places get each step:
//   - our own monthly counts (Firestore `siteStats/{YYYY-MM}`, through the
//     countStep function), shown under Events > Report. Each step counts once
//     per visitor session, so a refresh doesn't inflate it.
//   - Google Analytics (measurement id in utils/firebase.js), for where people
//     come from and on what device.
// Nothing personal is sent: no names, emails or form answers.
// Browsers that have been signed in to a team page are left out, so your own
// visits don't count.

export const FUNNEL = [
  { step: 'visit', label: 'Visited the site' },
  { step: 'inquiries_view', label: 'Opened the inquiries page' },
  { step: 'pricing_seen', label: 'Scrolled to pricing' },
  { step: 'quote_open', label: 'Opened the quote form' },
  { step: 'quote_start', label: 'Started filling it in' },
  { step: 'quote_submit', label: 'Sent an inquiry' },
]
// Counted every time, not once per session.
export const EXTRA = [
  { step: 'quote_abandon', label: 'Closed the form after starting it' },
  { step: 'quote_error', label: 'Form errors' },
]
const ONCE = new Set(FUNNEL.map((f) => f.step))
const ALL = new Set([...ONCE, ...EXTRA.map((f) => f.step)])

const TEAM_KEY = 'bybo-team'
const store = (kind) => {
  try {
    return window[kind]
  } catch (e) {
    return null
  }
}
const prerendering = () => typeof navigator === 'undefined' || navigator.userAgent === 'ReactSnap'
const isTeamBrowser = () => {
  try {
    return store('localStorage')?.getItem(TEAM_KEY) === '1'
  } catch (e) {
    return false
  }
}

// Called by the team pages: this browser belongs to the team; don't count it.
export const markTeamBrowser = () => {
  try {
    store('localStorage')?.setItem(TEAM_KEY, '1')
  } catch (e) {
    /* storage blocked: nothing to do */
  }
}

let analytics = null
let started = false
const queue = []
export const startTracking = () => {
  if (started || prerendering() || isTeamBrowser()) return
  started = true
  isSupported()
    .then((ok) => {
      if (!ok) return
      analytics = getAnalytics(getApp())
      queue.splice(0).forEach(([name, params]) => logEvent(analytics, name, params))
    })
    .catch(() => {})
}

export const track = (step, params = {}) => {
  if (!ALL.has(step) || prerendering() || isTeamBrowser()) return
  try {
    if (analytics) logEvent(analytics, step, params)
    else queue.push([step, params])
  } catch (e) {
    /* analytics problems never break the page */
  }
  if (ONCE.has(step)) {
    const s = store('sessionStorage')
    try {
      if (s && s.getItem(`bybo-step-${step}`)) return
      if (s) s.setItem(`bybo-step-${step}`, '1')
    } catch (e) {
      /* storage blocked: count it anyway */
    }
  }
  httpsCallable(getFunctions(), 'countStep')({ step }).catch(() => {})
}
