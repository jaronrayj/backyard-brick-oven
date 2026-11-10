import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import logo from '../../assets/brickovenLogoText.png'
import instagramLogo from '../../assets/instagram.png'
import facebookLogo from '../../assets/facebook.png'
import { track } from '../../utils/track'
import { rtdbGet } from '../../utils/publicData'
import { TEXT_CONSENT, looksLikePhone } from './signupText'

// /hello: landing page for the QR code on event posters. Follow us, join the
// list for free Roasted Garlic Breadsticks or a F'Zookie, or book us. Sign-ups go to the sendSignup function
// (functions/signup.js, /api/signup) and show up under Events > Signups.

// The code stays on this phone, so coming back to the page shows it again.
const SAVED = 'bybo-hello-code'
const readSaved = () => {
  try {
    return JSON.parse(window.localStorage.getItem(SAVED) || 'null')
  } catch (e) {
    return null
  }
}
const save = (value) => {
  try {
    if (value) window.localStorage.setItem(SAVED, JSON.stringify(value))
    else window.localStorage.removeItem(SAVED)
  } catch (e) {
    /* storage blocked: the code is still on screen */
  }
}

const bigButton =
  'flex items-center justify-center gap-3 w-full py-4 px-5 rounded-xl text-lg font-bold shadow-md transition-colors duration-200'

// Straight to the profiles (same links as the home page), so they work
// anywhere, not only where the /instagram and /facebook forwards exist.
const INSTAGRAM = 'https://www.instagram.com/backyard_brick_oven/'
const FACEBOOK = 'https://www.facebook.com/people/Backyard-Brick-Oven-LLC/100090391791253/'

const Follow = () => (
  <div className="space-y-3">
    <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className={`${bigButton} bg-white text-gray-900 hover:bg-gray-100`}>
      <img src={instagramLogo} alt="" className="h-7 w-7" />
      Follow on Instagram
    </a>
    <a href={FACEBOOK} target="_blank" rel="noopener noreferrer" className={`${bigButton} bg-white text-gray-900 hover:bg-gray-100`}>
      <img src={facebookLogo} alt="" className="h-7 w-7" />
      Follow on Facebook
    </a>
  </div>
)

// The two freebies, named and pictured as on the menu. Photos come from the
// menu itself (Realtime Database `pizzas`, edited at /admin/menu), so a new
// menu photo shows up here too. No photo yet (or offline): just the name.
const OFFER = "Free Roasted Garlic Breadsticks or a F'Zookie"
const TREATS = [
  { label: 'Roasted Garlic Breadsticks', match: /breadstick/i },
  { label: "F'Zookie", match: /zookie/i },
]
const useTreatPhotos = () => {
  const [photos, setPhotos] = useState({})
  useEffect(() => {
    if (navigator.userAgent === 'ReactSnap') return
    rtdbGet('pizzas')
      .then((menu) => {
        const items = Object.values(menu || {})
        const found = {}
        TREATS.forEach((t) => {
          const hits = items.filter((p) => p && t.match.test(p.name || '') && (p.thumb || p.img))
          const item = hits.find((p) => String(p.active) === 'true') || hits[0]
          if (item) found[t.label] = item.thumb || item.img
        })
        setPhotos(found)
      })
      .catch(() => {})
  }, [])
  return photos
}

const Treats = ({ photos, small = false }) => (
  <div className="grid grid-cols-2 gap-3">
    {TREATS.map(({ label }, i) => (
      <figure key={label} className={`bg-white rounded-xl overflow-hidden ${small ? 'border border-amber-200' : 'shadow-md'}`}>
        <div className={`${small ? 'h-20' : 'h-32'} bg-amber-50`}>
          {photos[label] && <img src={photos[label]} alt={label} loading="lazy" className="w-full h-full object-cover" />}
        </div>
        <figcaption className={`px-2 py-2 font-bold text-gray-900 leading-tight ${small ? 'text-sm' : ''}`}>{label}</figcaption>
      </figure>
    ))}
  </div>
)

const CodeCard = ({ name, code, photos, onReset }) => (
  <div className="bg-white rounded-xl shadow-md p-6 text-center space-y-3">
    <p className="text-gray-700">You're in{name ? `, ${name}` : ''}!</p>
    <div className="border-4 border-dashed border-amber-500 rounded-xl py-5 px-3 bg-amber-50">
      <p className="text-4xl font-extrabold text-gray-900 tracking-tight">FREE</p>
      <p className="text-gray-700 mt-1 mb-3">Roasted Garlic Breadsticks or a F'Zookie on your next visit</p>
      <Treats photos={photos} small />
      <p className="mt-4 font-mono text-3xl font-bold tracking-widest text-amber-700">{code}</p>
    </div>
    <p className="font-semibold text-gray-900">Screenshot this and show it at the counter.</p>
    <button type="button" onClick={onReset} className="text-sm text-gray-500 underline">
      Sign up someone else
    </button>
  </div>
)

const SignUp = ({ onDone }) => {
  const [contact, setContact] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const phone = looksLikePhone(contact)

  const submit = async (e) => {
    e.preventDefault()
    const form = e.target
    const fd = new FormData(form)
    const name = String(fd.get('name') || '').trim()
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contact,
          consent: phone && fd.get('consent') === 'on',
          _gotcha: fd.get('_gotcha') || '',
        }),
      })
      let data = {}
      try {
        data = await res.json()
      } catch (_) {
        /* non-JSON error: keep the default message */
      }
      if (!res.ok || !data.code) throw new Error(data.error || 'Something went wrong. Please try again.')
      track('hello_signup')
      onDone({ name, code: data.code })
    } catch (err) {
      setError(err.message || 'Could not sign up right now. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-xl shadow-md p-6 text-left space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Join our list</h2>
        <p className="text-gray-600 text-sm mt-1">Hear about Pizza Fridays, pop-ups and specials, and get free Roasted Garlic Breadsticks or a F'Zookie on us.</p>
      </div>
      {/* Honeypot: hidden from people, bots tend to fill it */}
      <input type="text" name="_gotcha" tabIndex="-1" autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="block">
        <span className="text-sm text-gray-700">First name</span>
        <input type="text" name="name" required maxLength={60} autoComplete="given-name" className="w-full mt-1 p-3 rounded-lg border text-gray-800 text-lg" />
      </label>
      <label className="block">
        <span className="text-sm text-gray-700">Phone or email</span>
        <input
          type="text"
          name="contact"
          required
          maxLength={120}
          inputMode={phone ? 'tel' : 'email'}
          autoComplete="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="w-full mt-1 p-3 rounded-lg border text-gray-800 text-lg"
        />
      </label>
      {phone && (
        <label className="flex items-start gap-3 text-sm text-gray-700">
          <input type="checkbox" name="consent" required className="mt-1 h-5 w-5 shrink-0 accent-amber-600" />
          <span>{TEXT_CONSENT}</span>
        </label>
      )}
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className={`${bigButton} bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60`}
      >
        {busy ? 'Signing up…' : 'Get my freebie'}
      </button>
    </form>
  )
}

const Hello = () => {
  // Read after the first render so the prerendered page (react-snap) always shows the form.
  const [done, setDone] = useState(null)
  const photos = useTreatPhotos()
  useEffect(() => {
    const saved = readSaved()
    if (saved && saved.code) setDone(saved)
  }, [])

  const finish = (value) => {
    save(value)
    setDone(value)
    window.scrollTo(0, 0)
  }

  return (
    <>
      <Helmet>
        <title>Hello! | Backyard Brick Oven</title>
        <meta name="description" content="Join the Backyard Brick Oven list and get free Roasted Garlic Breadsticks or a F'Zookie. Neapolitan-style pizza in Bountiful, Utah." />
        <link rel="canonical" href="https://backyardbrickovenpizza.com/hello" />
      </Helmet>
      <div className="bg-slate-200 min-h-screen">
        <div className="max-w-md mx-auto px-4 py-6 space-y-5">
          <div className="bg-white rounded-2xl shadow-md p-4 w-60 mx-auto">
            <img src={logo} alt="Backyard Brick Oven" className="w-full" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">{OFFER}</h1>
          {done ? (
            <CodeCard name={done.name} code={done.code} photos={photos} onReset={() => finish(null)} />
          ) : (
            <>
              <Treats photos={photos} />
              <Follow />
              <SignUp onDone={finish} />
            </>
          )}
          {done && <Follow />}
          <a href="/inquiries" className={`${bigButton} bg-gray-900 text-white hover:bg-gray-700`}>
            Book us for your event
          </a>
        </div>
      </div>
    </>
  )
}

export default Hello
