import React, { useEffect, useState } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getMessaging, getToken, deleteToken, isSupported } from 'firebase/messaging'

// "Notifications" on /events: turns phone notifications on or off for this
// device. The server (functions/push.js) decides who may sign up and what is
// sent: new inquiries, dough steps, and a 7 am summary of the day.
const callable = (name) => httpsCallable(getFunctions(), name)

const swRegistration = () => navigator.serviceWorker.register('/firebase-messaging-sw.js')

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
        console.error(e)
        if (live) setState('off')
      }
    })()
    return () => {
      live = false
    }
  }, [])

  const toggle = async () => {
    const turnOn = state !== 'on'
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
      if (turnOn) setMessage("You're set. You'll get new inquiries, dough steps, and a 7 am summary.")
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

  return (
    <div className={className}>
      <button
        type="button"
        className="px-3 py-1.5 rounded-md text-sm font-medium border bg-white border-gray-300 text-gray-700 hover:border-gray-900 disabled:opacity-50"
        disabled={['loading', 'busy', 'unsupported', 'blocked'].includes(state)}
        onClick={toggle}
        title={help || ''}
      >
        {state === 'on' ? '🔔 Notifications on' : state === 'busy' ? '…' : '🔕 Notifications'}
      </button>
      {(help || message) && <p className="text-xs text-gray-600 mt-1 max-w-xs">{help || message}</p>}
    </div>
  )
}

export default Notifications
