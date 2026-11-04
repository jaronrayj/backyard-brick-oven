import React, { useEffect, useState } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getMessaging, getToken, deleteToken, isSupported } from 'firebase/messaging'
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

const isIOSBrowserTab = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches

const Notifications = ({ className }) => {
  const [state, setState] = useState('loading') // loading | off | on | blocked | unsupported | busy
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
        const on = token ? (await callable('pushStatus')({ token })).data.on : false
        if (live) setState(on ? 'on' : 'off')
      } catch (e) {
        // Usually the API key blocking Firebase Installations / FCM Registration (see docs/events.md).
        console.error(e)
        if (live) {
          setState('off')
          setMessage(`Couldn't check notifications on this device: ${e.message || e}`)
        }
      }
    })()
    return () => {
      live = false
    }
  }, [])

  const sendTest = async () => {
    setMenu(false)
    setState('busy')
    setMessage('')
    try {
      const token = await deviceToken(false)
      if (!token) throw new Error('This device has no push token. Turn notifications off and on again.')
      const { data } = await callable('testPush')({ token })
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
          <button type="button" className="w-full text-left px-3 py-2 hover:bg-amber-50 text-gray-800" onClick={sendTest}>
            Send a test
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
