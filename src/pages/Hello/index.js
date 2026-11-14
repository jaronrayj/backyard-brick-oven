import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { getFunctions, httpsCallable } from 'firebase/functions'
import logo from '../../assets/brickovenLogoText.png'
import instagramLogo from '../../assets/instagram.png'
import facebookLogo from '../../assets/facebook.png'
import googleCalendarLogo from '../../assets/google-calendar-logo.png'
import { track } from '../../utils/track'
import { rtdbGet } from '../../utils/publicData'
import { APPLE_CALENDAR, GOOGLE_CALENDAR } from '../../utils/calendarLinks'
import { EMAIL_MAX, NAME_MAX, checkSignup } from './signupText'

// /hello: landing page for the QR code on event posters. A free Roasted Garlic
// Breadsticks or F'Zookie for showing this screen at Pizza Friday (on trust:
// no sign-up, no code), follow us, join the email list (functions/signup.js),
// the next Pizza Fridays and adding them to your calendar, or book us.

// Straight to the profiles (same links as the home page), so they work
// anywhere, not only where the /instagram and /facebook forwards exist.
const INSTAGRAM = 'https://www.instagram.com/backyard_brick_oven/'
const FACEBOOK = 'https://www.facebook.com/people/Backyard-Brick-Oven-LLC/100090391791253/'
const DIRECTIONS = 'https://g.co/kgs/8o94du5'


// The two freebies, named and pictured as on the menu. Photos come from the
// menu itself (Realtime Database `pizzas`, edited at /admin/menu), so a new
// menu photo shows up here too. No photo yet (or offline): just the name.
const TREATS = [
  { label: 'Roasted Garlic Breadsticks', match: /breadstick/i },
  { label: "F'Zookie", match: /zookie/i },
]

const prerendering = () => typeof navigator === 'undefined' || navigator.userAgent === 'ReactSnap'

const useTreatPhotos = () => {
  const [photos, setPhotos] = useState({})
  useEffect(() => {
    if (prerendering()) return
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

// Next Pizza Fridays from the business calendar, as on the home page.
const useFridays = () => {
  const [fridays, setFridays] = useState([])
  useEffect(() => {
    if (prerendering()) return
    httpsCallable(getFunctions(), 'upcomingPizzaFridays')()
      .then((res) => setFridays(((res.data && res.data.dates) || []).slice(0, 3)))
      .catch(() => {})
  }, [])
  return fridays
}
const fridayLabel = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })

const bigButton =
  'flex items-center justify-center gap-3 w-full py-4 px-5 rounded-xl text-lg font-bold shadow-md transition-colors duration-200'
const whiteButton = `${bigButton} bg-white text-gray-900 hover:bg-gray-100`

const Treats = ({ photos }) => (
  <div className="grid grid-cols-2 gap-3">
    {TREATS.map(({ label }) => (
      <figure key={label} className="bg-white rounded-xl overflow-hidden border border-amber-200">
        <div className="h-28 bg-amber-50">
          {photos[label] && <img src={photos[label]} alt={label} loading="lazy" className="w-full h-full object-cover" />}
        </div>
        <figcaption className="px-2 py-2 font-bold text-gray-900 leading-tight">{label}</figcaption>
      </figure>
    ))}
  </div>
)

const Freebie = ({ photos }) => (
  <div className="bg-white rounded-xl shadow-md p-5 text-center space-y-3">
    <div className="border-4 border-dashed border-amber-500 rounded-xl p-4 bg-amber-50 space-y-3">
      <p className="text-4xl font-extrabold text-gray-900 tracking-tight">FREE</p>
      <p className="text-gray-800 font-semibold">Roasted Garlic Breadsticks or a F'Zookie</p>
      <Treats photos={photos} />
    </div>
    <p className="font-semibold text-gray-900">Show this screen at any Pizza Friday. Screenshot it so you have it!</p>
  </div>
)

const PizzaFriday = ({ fridays }) => (
  <div className="bg-white rounded-xl shadow-md p-5 space-y-4">
    <div>
      <h2 className="text-xl font-bold text-gray-900">Pizza Friday</h2>
      <p className="text-gray-700">5–7:30 pm in Bountiful</p>
      {fridays.length > 0 && <p className="text-gray-700 mt-1">Next: {fridays.map((f) => fridayLabel(f.date)).join(' · ')}</p>}
      <a href={DIRECTIONS} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 text-amber-700 font-semibold underline">
        Directions
      </a>
    </div>
    <div className="space-y-2">
      <p className="font-semibold text-gray-900">Add Pizza Fridays to your calendar</p>
      <a href={APPLE_CALENDAR} onClick={() => track('hello_calendar', { calendar: 'apple' })} className={`${bigButton} bg-gray-900 text-white hover:bg-gray-700`}>
        iPhone / Apple Calendar
      </a>
      <a
        href={GOOGLE_CALENDAR}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track('hello_calendar', { calendar: 'google' })}
        className={`${whiteButton} border border-gray-200`}
      >
        <img src={googleCalendarLogo} alt="" className="h-6 w-6" />
        Google Calendar
      </a>
    </div>
  </div>
)

const Follow = () => (
  <div className="bg-white rounded-xl shadow-md p-5 space-y-3">
    <div>
      <h2 className="text-xl font-bold text-gray-900">Follow us!</h2>
      <p className="text-gray-700">Pizza Friday menus, pop-ups and specials go up there first. It really helps a small business like ours.</p>
    </div>
    <a
      href={INSTAGRAM}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('hello_follow', { site: 'instagram' })}
      className={`${bigButton} text-white hover:opacity-90`}
      style={{ background: 'linear-gradient(45deg, #f58529, #dd2a7b 50%, #8134af)' }}
    >
      <img src={instagramLogo} alt="" className="h-7 w-7 rounded-md bg-white p-0.5" />
      Follow on Instagram
    </a>
    <a
      href={FACEBOOK}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('hello_follow', { site: 'facebook' })}
      className={`${bigButton} bg-[#1877f2] text-white hover:bg-[#166fe5]`}
    >
      <img src={facebookLogo} alt="" className="h-7 w-7 rounded-md bg-white p-0.5" />
      Follow on Facebook
    </a>
  </div>
)

const SignUp = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const checked = checkSignup({ name, email })
    if (checked.error) return setError(checked.error)
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, _gotcha: new FormData(e.target).get('_gotcha') || '' }),
      })
      let data = {}
      try {
        data = await res.json()
      } catch (_) {
        /* non-JSON error: keep the default message */
      }
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
      track('hello_signup')
      setDone(true)
    } catch (err) {
      setError(err.message || 'Could not sign up right now. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="bg-white rounded-xl shadow-md p-5 space-y-1" role="status">
        <h2 className="text-xl font-bold text-gray-900">You're on the list{name.trim() ? `, ${name.trim().split(' ')[0]}` : ''}!</h2>
        <p className="text-gray-700">We'll only email when there's something worth sharing.</p>
      </div>
    )
  }
  return (
    <form onSubmit={submit} className="bg-white rounded-xl shadow-md p-5 space-y-3" noValidate>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Get Pizza Friday news by email</h2>
        <p className="text-gray-700">New pizzas, pop-ups and specials. No spam, just pizza.</p>
      </div>
      {/* Honeypot: hidden from people, bots tend to fill it */}
      <input type="text" name="_gotcha" tabIndex="-1" autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="block">
        <span className="text-sm text-gray-700">Email</span>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={EMAIL_MAX}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-1 p-3 rounded-lg border text-gray-800 text-lg"
        />
      </label>
      <label className="block">
        <span className="text-sm text-gray-700">First name (optional)</span>
        <input
          type="text"
          autoComplete="given-name"
          maxLength={NAME_MAX}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mt-1 p-3 rounded-lg border text-gray-800 text-lg"
        />
      </label>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className={`${bigButton} bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60`}>
        {busy ? 'Signing up…' : 'Sign me up'}
      </button>
    </form>
  )
}

const Hello = () => {
  const photos = useTreatPhotos()
  const fridays = useFridays()
  return (
    <>
      <Helmet>
        <title>Hello! | Backyard Brick Oven</title>
        <meta
          name="description"
          content="Free Roasted Garlic Breadsticks or a F'Zookie at Pizza Friday. Neapolitan-style pizza in Bountiful, Utah."
        />
        <link rel="canonical" href="https://backyardbrickovenpizza.com/hello" />
      </Helmet>
      <div className="bg-slate-200 min-h-screen">
        <div className="max-w-md mx-auto px-4 py-6 space-y-5">
          <div className="bg-white rounded-2xl shadow-md p-4 w-60 mx-auto">
            <img src={logo} alt="Backyard Brick Oven" className="w-full" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Thanks for eating with us!</h1>
          <Freebie photos={photos} />
          <Follow />
          <SignUp />
          <PizzaFriday fridays={fridays} />
          <a href="/inquiries" className={`${bigButton} bg-amber-600 text-white hover:bg-amber-700`}>
            Book us for your event
          </a>
        </div>
      </div>
    </>
  )
}

export default Hello
