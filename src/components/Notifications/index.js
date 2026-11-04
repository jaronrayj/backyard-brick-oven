import React, { useEffect, useState } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getMessaging, getToken, deleteToken, isSupported, onMessage } from 'firebase/messaging'
import { BellIcon } from '@heroicons/react/outline'
import { BellIcon as BellSolid } from '@heroicons/react/solid'

// The bell in the team bar: turns phone notifications on or off for this
// device. The server (functions/push.js) decides who may sign up and what is
// sent: new inquiries, dough steps, and a morning summary of the day (times set under Events > Pricing).
const callable = (name) => httpsCallable(getFunctions(), name)

// Push needs an *active* service worker; right after the first register() it's
// still installing, so wait for it to finish.
const swRegistration = async () => {
  const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
  if (reg.active) return reg
  const sw = reg.installing || reg.waiting
  if (sw) {
    await new Promise((resolve) => {
      const done = () => sw.state === 'activated' && resolve()
      sw.addEventListener('statechange', done)
      done()
      setTimeout(resolve, 10000)
    })
  }
  return reg
}

// This device's push token, or null. Only asks for permission when `ask`.
const deviceToken = async (ask) => {
  if (!(await isSupported())) return null
  if (Notification.permission !== 'granted') {
    if (!ask) return null
    if ((await Notification.requestPermission()) !== 'granted') return null
  }
  return getToken(getMessaging(), { serviceWorkerRegistration: await swRegistration() })
}

// With the site open and in front, Firebase hands a notification to the page
// instead of showing it, so show it here the same way the service worker would.
let foregroundShown = false
const showWhileOpen = async () => {
  if (foregroundShown) return
  foregroundShown = true
  const reg = await swRegistration()
  onMessage(getMessaging(), (payload) => {
    const n = payload.notification || {}
    const link = payload.fcmOptions?.link || payload.data?.link
    reg.showNotification(n.title || 'Backyard Brick Oven', {
      body: n.body,
      icon: n.icon || '/favicon-192.png',
      tag: n.tag,
      data: { FCM_MSG: { fcmOptions: { link } } },
    })
  })
}

const isIOSBrowserTab = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches

// Last known on/off for this device, so the bell shows right away after a
// reload instead of sitting grayed out while the server is asked.
const SAVED = 'bybo-push-on'
const savedState = () => {
  try {
    const v = localStorage.getItem(SAVED)
    return v === 'on' || v === 'off' ? v : 'loading'
  } catch (e) {
    return 'loading'
  }
}
const saveState = (v) => {
  try {
    if (v === 'on' || v === 'off') localStorage.setItem(SAVED, v)
  } catch (e) {
    // private window or blocked storage: the bell just starts gray
  }
}

const Notifications = ({ className }) => {
  const [state, setStateRaw] = useState(savedState)
  const setState = (v) => {
    saveState(v)
    setStateRaw(v)
  } // loading | off | on | blocked | unsupported | busy
  const [message, setMessage] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        if (!(await isSupported())) return live && setState('unsupported')
        if (Notification.permission === 'denied') return live && setState('blocked')
        const token = await deviceToken(false)
        // Turned on here before: re-register this device's current push ID on
        // every open. Phones get a new ID now and then (reinstall, browser
        // update), and the server would otherwise still hold the old one.
        let on = false
        if (token && savedState() === 'on') {
          await callable('registerPush')({ token, on: true })
          on = true
        } else if (token) {
          on = (await callable('pushStatus')({ token })).data.on
        }
        if (on) showWhileOpen().catch(console.error)
        if (live) setState(on ? 'on' : 'off')
      } catch (e) {
        // Usually the API key blocking Firebase Installations / FCM Registration (see docs/events.md).
        console.error(e)
        if (live) {
          // Keep what the bell last showed; a failed check doesn't mean it's off.
          setStateRaw((v) => (v === 'loading' ? 'off' : v))
          setMessage(`Couldn't check notifications on this device: ${e.message || e}`)
        }
      }
    })()
    return () => {
      live = false
    }
  }, [])

  const sendTest = async (delay = 0) => {
    setMenu(false)
    setMessage(delay ? `Lock your phone now. The test is sent in ${delay} seconds.` : '')
    setState('busy')
    try {
      const token = await deviceToken(false)
      if (!token) throw new Error('This device has no push token. Turn notifications off and on again.')
      const { data } = await callable('testPush')({ token, delay })
      setMessage(
        data.ok
          ? 'Test sent. It should pop up within a few seconds. If nothing shows, check that this browser or app is allowed to show notifications in your phone or computer settings.'
          : `The test didn't go through: ${data.error}`,
      )
    } catch (e) {
      console.error(e)
      setMessage(`Couldn't send a test: ${e.message || e}`)
    }
    setState('on')
  }

  // The little message under the bell clears itself: a few seconds for good
  // news, longer for a problem so there's time to read it.
  useEffect(() => {
    if (!message && !showHelp) return undefined
    const bad = /couldn't|didn't|blocked|can't|no push token/i.test(message)
    const t = setTimeout(() => {
      setMessage('')
      setShowHelp(false)
    }, message && !bad ? 4000 : 10000)
    return () => clearTimeout(t)
  }, [message, showHelp])

  const toggle = async () => {
    const turnOn = state !== 'on'
    setMenu(false)
    setState('busy')
    setMessage('')
    try {
      const token = await deviceToken(turnOn)
      if (!token) {
        setState(Notification.permission === 'denied' ? 'blocked' : 'off')
        return
      }
      await callable('registerPush')({ token, on: turnOn })
      if (!turnOn) await deleteToken(getMessaging()).catch(() => {})
      setState(turnOn ? 'on' : 'off')
      if (turnOn) showWhileOpen().catch(console.error)
      if (turnOn) setMessage("Notifications on. You'll get new inquiries, dough steps, and a morning summary. Tap the bell again to send yourself a test.")
    } catch (e) {
      console.error(e)
      setMessage(e.message || "Couldn't change notifications.")
      setState(turnOn ? 'off' : 'on')
    }
  }

  const help = {
    unsupported: isIOSBrowserTab()
      ? 'On iPhone, add this site to your Home Screen first (Share → Add to Home Screen), then open it from there.'
      : "This browser can't show notifications.",
    blocked: 'Notifications are blocked for this site. Allow them in the browser or app settings, then reload.',
  }[state]
  const note = message || (showHelp && help)
  const on = state === 'on'
  const Icon = on ? BellSolid : BellIcon

  return (
    <div className={`relative ${className || ''}`}>
      <button
        type="button"
        className={`p-2 rounded-full ${on ? 'text-amber-600' : 'text-gray-500'} hover:bg-gray-100 disabled:opacity-40`}
        disabled={['loading', 'busy'].includes(state)}
        onClick={() => (help ? setShowHelp((v) => !v) : on ? setMenu((v) => !v) : toggle())}
        aria-pressed={on}
        aria-expanded={on ? menu : undefined}
        aria-label={on ? 'Notifications on. Tap for options.' : 'Turn on notifications'}
        title={on ? 'Notifications on' : 'Turn on notifications'}
      >
        <Icon className={`h-6 w-6 ${state === 'busy' ? 'animate-pulse' : ''}`} aria-hidden="true" />
      </button>
      {menu && on && (
        <div className="absolute right-0 top-full mt-1 z-30 w-48 rounded-lg bg-white border border-gray-200 shadow-lg py-1 text-sm">
          <button type="button" className="w-full text-left px-3 py-2 hover:bg-amber-50 text-gray-800" onClick={() => sendTest(0)}>
            Send a test
          </button>
          <button type="button" className="w-full text-left px-3 py-2 hover:bg-amber-50 text-gray-800" onClick={() => sendTest(15)}>
            Send a test in 15 seconds
          </button>
          <button type="button" className="w-full text-left px-3 py-2 hover:bg-amber-50 text-gray-800" onClick={toggle}>
            Turn off on this device
          </button>
        </div>
      )}
      {note && (
        <div role="status" className="absolute right-0 top-full mt-1 z-30 w-64 rounded-lg bg-gray-900 text-white text-xs p-3 shadow-lg">
          {note}
          <button type="button" className="block mt-2 underline" onClick={() => { setMessage(''); setShowHelp(false) }}>
            OK
          </button>
        </div>
      )}
    </div>
  )
}

export default Notifications
