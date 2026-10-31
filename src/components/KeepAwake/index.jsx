import React, { useEffect, useState } from 'react'

// "Keep screen on" for team pages, using the Screen Wake Lock API.
// The browser drops the lock when the page is hidden or left, so the choice is
// remembered on this device and the lock is taken again whenever a page with
// this button is showing.
const KEY = 'bybo.keepAwake'

const readPref = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch (e) {
    return false
  }
}

const writePref = (on) => {
  try {
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch (e) {
    /* private mode: the choice just isn't remembered */
  }
}

const KeepAwake = ({ className = '' }) => {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const [on, setOn] = useState(readPref)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!supported || !on) return undefined
    let lock = null
    let stopped = false
    const acquire = async () => {
      if (document.visibilityState !== 'visible' || (lock && !lock.released)) return
      try {
        lock = await navigator.wakeLock.request('screen')
        if (stopped) {
          lock.release()
          return
        }
        setActive(true)
        lock.addEventListener('release', () => setActive(false))
      } catch (e) {
        setActive(false)
      }
    }
    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', acquire)
      if (lock && !lock.released) lock.release()
      setActive(false)
    }
  }, [on, supported])

  if (!supported) return null

  const toggle = () => {
    writePref(!on)
    setOn(!on)
  }

  const label = !on ? 'Keep screen on' : active ? 'Screen stays on' : 'Tap to keep screen on'
  return (
    <button
      type="button"
      onClick={on && !active ? () => { setOn(false); setTimeout(() => setOn(true)) } : toggle}
      aria-pressed={on && active}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
        on && active ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-300 text-gray-800'
      } ${className}`}
    >
      {on && active ? '☀︎ ' : ''}
      {label}
    </button>
  )
}

export default KeepAwake
