import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import logo from '../../assets/brickovenLogoText.png'
import instagramLogo from '../../assets/instagram.png'
import facebookLogo from '../../assets/facebook.png'
import { track } from '../../utils/track'
import { rtdbGet } from '../../utils/publicData'
import { EMAIL_MAX, NAME_MAX, checkSignup } from './signupText'

// /hello: landing page for the QR code on event posters. One job: trade free
// Roasted Garlic Breadsticks or a F'Zookie for an email address, then ask for
// a follow while they're happy.
//   1. The offer and an email box (first name optional).
//   2. After signing up (functions/signup.js, which also sends a welcome
//      email): the freebie ticket to show at the counter, then Follow us.
// The ticket is remembered on this phone, so reopening the page shows it again.

// Straight to the profiles (same links as the home page), so they work
// anywhere, not only where the /instagram and /facebook forwards exist.
const INSTAGRAM = 'https://www.instagram.com/backyard_brick_oven/'
const FACEBOOK = 'https://www.facebook.com/people/Backyard-Brick-Oven-LLC/100090391791253/'
const DIRECTIONS = 'https://g.co/kgs/8o94du5'
const SAVED = 'bybo-hello-ticket'

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

// The ticket saved on this phone: { name, date } or null.
const loadTicket = () => {
  try {
    const t = JSON.parse(localStorage.getItem(SAVED))
    return t && t.date ? t : null
  } catch (_) {
    return null
  }
}
const saveTicket = (t) => {
  try {
    localStorage.setItem(SAVED, JSON.stringify(t))
  } catch (_) {
    /* private browsing: the ticket still shows until they leave */
  }
}
const prettyDay = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

const bigButton =
  'flex items-center justify-center gap-3 w-full py-4 px-5 rounded-xl text-lg font-bold shadow-md transition-colors duration-200'

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

// Step 1: the offer, paid for with an email address.
const Offer = ({ photos, onDone }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

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
      onDone({ name: checked.name, date: new Date().toISOString() })
    } catch (err) {
      setError(err.message || 'Could not sign up right now. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="bg-white rounded-xl shadow-md p-5 space-y-4">
      <div className="text-center space-y-1">
        <p className="text-4xl font-extrabold text-gray-900 tracking-tight">FREE</p>
        <p className="text-lg font-semibold text-gray-800">Roasted Garlic Breadsticks or a F'Zookie</p>
      </div>
      <Treats photos={photos} />
      <p className="text-gray-700">Join our email list and it's yours at any Pizza Friday. We only email when there's something worth sharing.</p>
      {/* Honeypot: hidden from people, bots tend to fill it */}
      <input type="text" name="_gotcha" tabIndex="-1" autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="block">
        <span className="text-sm text-gray-700">Email</span>
        <input
          id="hello-email"
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
          id="hello-name"
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
        {busy ? 'One sec…' : 'Get my freebie'}
      </button>
    </form>
  )
}

// Step 2a: the ticket to show at the counter.
const Ticket = ({ ticket, photos }) => {
  const first = (ticket.name || '').split(' ')[0]
  return (
    <div className="bg-white rounded-xl shadow-md p-5 text-center space-y-3" role="status">
      <p className="text-gray-800 font-semibold">{first ? `You're on the list, ${first}!` : "You're on the list!"}</p>
      <div className="border-4 border-dashed border-amber-500 rounded-xl p-4 bg-amber-50 space-y-3">
        <p className="text-4xl font-extrabold text-gray-900 tracking-tight">FREE</p>
        <p className="text-gray-800 font-semibold">Roasted Garlic Breadsticks or a F'Zookie</p>
        <Treats photos={photos} />
        <p className="text-sm text-gray-600">
          {first ? `For ${first} · ` : ''}Signed up {prettyDay(ticket.date)}
        </p>
      </div>
      <p className="font-semibold text-gray-900">Show this screen at any Pizza Friday. We emailed you a copy too.</p>
    </div>
  )
}

// Step 2b: the follow ask, right after they've got their freebie.
const Follow = () => (
  <div className="bg-white rounded-xl shadow-md p-5 space-y-3">
    <div>
      <h2 className="text-xl font-bold text-gray-900">One more thing: follow us!</h2>
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

const Hello = () => {
  const photos = useTreatPhotos()
  const [ticket, setTicket] = useState(null)
  useEffect(() => {
    if (!prerendering()) setTicket(loadTicket())
  }, [])
  const done = (t) => {
    saveTicket(t)
    setTicket(t)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Helmet>
        <title>Hello! | Backyard Brick Oven</title>
        <meta
          name="description"
          content="Free Roasted Garlic Breadsticks or a F'Zookie at Pizza Friday when you join our email list. Neapolitan-style pizza in Bountiful, Utah."
        />
        <link rel="canonical" href="https://backyardbrickovenpizza.com/hello" />
      </Helmet>
      <div className="bg-slate-200 min-h-screen">
        <div className="max-w-md mx-auto px-4 py-6 space-y-5">
          <div className="bg-white rounded-2xl shadow-md p-4 w-56 mx-auto">
            <img src={logo} alt="Backyard Brick Oven" className="w-full" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Thanks for eating with us!</h1>
          {ticket ? (
            <>
              <Ticket ticket={ticket} photos={photos} />
              <Follow />
            </>
          ) : (
            <Offer photos={photos} onDone={done} />
          )}
          <p className="text-center text-gray-700">
            Pizza Friday · 5–7:30 pm · Bountiful ·{' '}
            <a href={DIRECTIONS} target="_blank" rel="noopener noreferrer" className="text-amber-700 font-semibold underline">
              Directions
            </a>
            <br />
            <a href="/inquiries" className="text-amber-700 font-semibold underline">
              Book us for your event
            </a>
          </p>
        </div>
      </div>
    </>
  )
}

export default Hello
