import React from 'react'
import { Helmet } from 'react-helmet-async'
import nightPizza from '../../assets/night_pizza.jpg'
import pizzaParty from '../../assets/pizza_party.jpg'
import specialSpread from '../../assets/special_touches_spread.jpg'
import servingCanopy from '../../assets/serving_canopy.jpg'

const EVENT_TYPES = [
  'Wedding',
  'Birthday or family party',
  'Holiday party',
  'Corporate or work event',
  'Bridal shower or bachelorette',
  'Pizza class',
  'Other',
]

const ADD_ONS = ['Salad', 'Pasta', 'Dessert', 'Charcuterie board']

const todayISO = () => {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

// Shape the form into the payload the sendInquiry function expects.
// The live function requires `event_type` and `contact`, so add-ons are folded
// into the event type and email/phone are joined into `contact`.
const buildPayload = (form) => {
  const fd = new FormData(form)
  const addOns = fd.getAll('add_ons')
  const type = fd.get('event_type_choice') === 'Other'
    ? String(fd.get('event_type_other') || '').trim() || 'Other'
    : String(fd.get('event_type_choice') || '').trim()
  const email = String(fd.get('email') || '').trim()
  const phone = String(fd.get('phone') || '').trim()

  const payload = {}
  for (const [key, value] of fd.entries()) {
    if (['add_ons', 'event_type_choice', 'event_type_other', 'email', 'phone'].includes(key)) continue
    payload[key] = value
  }
  payload.event_type = addOns.length ? `${type} + ${addOns.join(', ')}` : type
  payload.contact = [email, phone].filter(Boolean).join(' / ')
  return payload
}

const Inquiries = () => {
  const [showForm, setShowForm] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState('')
  const [eventType, setEventType] = React.useState('')

  React.useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setShowForm(false) }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  const openForm = (type = '') => {
    if (type) setEventType(type)
    setShowForm(true)
  }

  const showAddOns = eventType && eventType !== 'Pizza class'

  return (
    <div className="bg-slate-200 lg:w-3/4 m-auto">

      <Helmet>
        <title>Catering & Event Inquiries | Backyard Brick Oven — Bountiful, Utah</title>
        <meta
          name="description"
          content="Book Backyard Brick Oven for your next event. Mobile brick oven catering serving fresh Neapolitan-style pizza in Bountiful, Utah and surrounding areas."
        />
        <link rel="canonical" href="https://backyard-brickoven.web.app/inquiries" />
      </Helmet>

      {/* Hero — image background with headline + primary CTA above the fold */}
      <div className="relative">
        <img
          src={pizzaParty}
          alt="Brick oven pizza catering setup"
          className="w-full h-[70vh] min-h-[420px] object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-center text-white px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 max-w-3xl drop-shadow">
            Let's Make Your Next Event Unforgettable
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl drop-shadow">
            Fresh brick oven pizza, right at your event. No lines, no cleanup.
          </p>
          <button
            onClick={() => openForm()}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg py-4 px-10 rounded-lg shadow-lg transition-colors duration-200"
          >
            Get a Quote
          </button>
          <p className="text-sm mt-4 text-gray-200">
            Or text us at{' '}
            <a href="sms:+18018723439" className="underline font-semibold">
              (801) 872-3439
            </a>
          </p>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">

        {/* What we bring + how it works, side by side on desktop */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* What We Bring */}
          <div className="bg-white rounded-xl p-6 shadow-md flex flex-col justify-center">
            <h2 className="text-2xl font-bold mb-4 text-center">What We Bring to You</h2>
            <img
              src={servingCanopy}
              alt="Backyard Brick Oven serving station set up under a canopy at an event"
              className="rounded-lg w-full h-44 object-cover mb-5"
            />
            <ul className="space-y-3 text-gray-700">
              {[
                'On-site brick oven, set up and ready to go',
                '10" artisan pizzas cooked fresh in ~60 seconds',
                'Classic + specialty pizzas for every taste',
                'Setup, continuous service, and cleanup — all handled',
              ].map((item) => (
                <li key={item} className="flex items-start">
                  <span className="text-green-600 mr-2 mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-xl p-6 shadow-md flex flex-col justify-center">
            <h2 className="text-2xl font-bold mb-1 text-center">Simple. Stress-Free. Done.</h2>
            <p className="text-gray-600 mb-5 text-center">Three steps and you're set.</p>
            <div className="space-y-4 text-left mx-auto">
              {[
                ['1', 'Tell us about your event', 'Date, guest count, and location.'],
                ['2', 'We plan it with you', 'Pick our pizzas or build your own.'],
                ['3', 'We show up & cook', 'You relax — we handle the rest.'],
              ].map(([num, title, desc]) => (
                <div key={num} className="flex items-center">
                  <div className="bg-yellow-500 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold shrink-0 mr-3">
                    {num}
                  </div>
                  <div>
                    <h3 className="font-bold leading-tight">{title}</h3>
                    <p className="text-gray-700 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="bg-amber-50 rounded-xl p-6 shadow-md border-l-4 border-amber-400">
          <h2 className="text-2xl font-bold mb-2">Perfect for Any Event</h2>
          <p className="text-gray-700">
            Birthdays, weddings, corporate parties, graduations — groups of
            25–200. Fresh slices come out nonstop, so nobody waits in line.
          </p>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">Pricing</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Weddings */}
            <div className="rounded-xl p-6 border-2 border-amber-300 bg-gradient-to-br from-orange-50 to-yellow-50 flex flex-col text-left">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold">Weddings</h3>
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 rounded-full px-3 py-1">
                  Most popular
                </span>
              </div>
              <p className="text-gray-700 mb-4 min-h-[3rem]">
                A brick oven front and center, and a spread guests remember.
              </p>
              <p className="text-3xl font-bold text-gray-900">
                Starting at $1,500
              </p>
              <p className="mb-4 text-sm text-gray-600">Up to 100 guests</p>
              <ul className="space-y-2 text-gray-700 text-sm flex-1">
                {[
                  'On-site brick oven, setup, service & cleanup',
                  'Rotating fresh pizzas served buffet-style',
                  'Custom menu built with you',
                  'Add salad or pasta for $3–5 per guest',
                ].map((item) => (
                  <li key={item} className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Groups / Parties */}
            <div className="rounded-xl p-6 border border-gray-200 bg-white flex flex-col text-left">
              <h3 className="text-xl font-bold mb-1">Parties & Groups</h3>
              <p className="text-gray-700 mb-4 min-h-[3rem]">
                Buffet-style service with four pizzas in constant rotation.
              </p>
              <p className="mb-4 text-3xl font-bold text-gray-900">
                Priced per guest
              </p>
              <ul className="space-y-2 text-gray-700 text-sm flex-1">
                {[
                  'Buffet-style, four pizzas in constant rotation',
                  'Booked in groups of 10 (we round up)',
                  'Travel included in your quote',
                ].map((item) => (
                  <li key={item} className="flex items-start">
                    <span className="text-green-600 mr-2 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Special Touches — featured with a real spread photo */}
          <div className="mt-6 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 md:flex">
            <img
              src={specialSpread}
              alt="Catered spread with panna cotta, charcuterie board, and beet & goat cheese salad"
              className="w-full md:w-1/2 h-64 md:h-auto object-cover"
            />
            <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-center">
              <h4 className="text-2xl font-bold text-gray-800 mb-3">
                Special Touches
              </h4>
              <p className="text-gray-700 leading-relaxed">
                Something more intimate — a bridal shower or bachelorette party?
                We can add elevated touches like charcuterie boards, seasonal
                salads, and house-made desserts. Quoted to match.
              </p>
            </div>
          </div>

          {/* Travel note */}
          <div className="mt-6 rounded-xl p-5 bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-gray-800 mb-1">Travel</h4>
            <p className="text-gray-700 text-sm">
              Based in Bountiful, happy to travel. A travel fee may apply by
              distance — always spelled out in your quote.
            </p>
          </div>
        </div>

        {/* Pizza Classes */}
        <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-xl p-6 md:p-8 shadow-md border-2 border-orange-300">
          <div className="md:flex gap-8 items-center">
            <img
              src={nightPizza}
              alt="Hands-on pizza class"
              className="rounded-xl md:w-1/2 mb-6 md:mb-0 object-cover max-h-64 w-full"
            />
            <div className="text-gray-700 space-y-3 leading-relaxed">
              <h2 className="text-2xl font-bold">Want to Make Your Own Pizza?</h2>
              <p>
                Hands-on classes for groups of 8–30 — great for date nights and
                team events.
              </p>
              <p>
                Stretch your own dough, load it up, and cook it in a real brick
                oven. Then eat what you made.
              </p>
              <p>We bring everything. You just show up hungry.</p>
            </div>
          </div>
        </div>

        {/* Service area + final CTA, side by side */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md lg:col-span-1 flex flex-col justify-center">
            <h2 className="text-xl font-bold mb-2">Service Area</h2>
            <p className="text-gray-700">
              Based in Bountiful, Utah, and traveling throughout Northern Utah —
              just ask!
            </p>
          </div>
          <div className="bg-amber-600 text-white text-center py-8 px-6 rounded-xl shadow-md lg:col-span-2 flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-3">Let's Get You a Quote</h2>
            <p className="text-lg mb-6">
              Tell us about your event and we'll take it from there.
            </p>
            <button
              onClick={() => openForm()}
              className="bg-white text-amber-700 font-bold text-lg py-4 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-md self-center"
            >
              Get a Quote
            </button>
          </div>
        </div>

      </div>

      {/* Quote Modal */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${showForm ? '' : 'hidden'}`} onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {submitted ? (
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Thanks for reaching out!</h2>
                <p className="text-gray-600 mb-6">We'll get back to you soon.</p>
                <button
                  onClick={() => { setSubmitted(false); setShowForm(false) }}
                  className="bg-amber-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-amber-700 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            ) : (
            <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Get a Quote</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const form = e.target
                setError('')
                const fd = new FormData(form)
                if (!String(fd.get('email') || '').trim() && !String(fd.get('phone') || '').trim()) {
                  setError('Please add an email or phone number so we can reach you.')
                  return
                }
                setSubmitting(true)
                try {
                  const payload = buildPayload(form)
                  const res = await fetch('/api/inquiry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  })
                  if (!res.ok) {
                    let message = 'Something went wrong. Please try again.'
                    try {
                      const data = await res.json()
                      if (data && data.error) message = data.error
                    } catch (_) {
                      /* non-JSON error response — keep default message */
                    }
                    throw new Error(message)
                  }
                  form.reset()
                  setEventType('')
                  setSubmitted(true)
                } catch (err) {
                  setError(
                    err.message ||
                      'Could not send right now. Please text us at (801) 872-3439.'
                  )
                } finally {
                  setSubmitting(false)
                }
              }}
              className="text-left"
            >
              {/* Honeypot: hidden from users, bots tend to fill it */}
              <input
                type="text"
                name="_gotcha"
                tabIndex="-1"
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />
              <label className="block mb-3">
                <span className="text-sm text-gray-700">Name</span>
                <input type="text" name="name" required className="w-full mt-1 p-2 rounded border text-gray-800" />
              </label>
              <label className="block mb-3">
                <span className="text-sm text-gray-700">Type of Event</span>
                <select
                  name="event_type_choice"
                  required
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full mt-1 p-2 rounded border text-gray-800 bg-white"
                >
                  <option value="" disabled>Choose one</option>
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
              {eventType === 'Other' && (
                <label className="block mb-3">
                  <span className="text-sm text-gray-700">What kind of event?</span>
                  <input type="text" name="event_type_other" required className="w-full mt-1 p-2 rounded border text-gray-800" />
                </label>
              )}
              {eventType === 'Wedding' && (
                <p className="mb-3 -mt-1 text-xs text-gray-600">
                  Weddings start at $1,500 for up to 100 guests.
                </p>
              )}
              {showAddOns && (
                <fieldset className="mb-3">
                  <legend className="text-sm text-gray-700">Add-ons (optional)</legend>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                    {ADD_ONS.map((item) => (
                      <label key={item} className="flex items-center text-sm text-gray-800">
                        <input type="checkbox" name="add_ons" value={item} className="mr-2" />
                        {item}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Salad or pasta adds about $3–5 per guest.</p>
                </fieldset>
              )}
              <label className="block mb-3">
                <span className="text-sm text-gray-700">Who's the event for?</span>
                <input type="text" name="event_for" required placeholder="e.g. Myself, my daughter, our company" className="w-full mt-1 p-2 rounded border text-gray-800" />
              </label>
              <label className="block mb-3">
                <span className="text-sm text-gray-700">Event Date</span>
                <input type="date" name="event_date" required min={todayISO()} className="w-full mt-1 p-2 rounded border text-gray-800" />
              </label>
              <label className="block mb-3">
                <span className="text-sm text-gray-700">Event Location</span>
                <input type="text" name="event_location" required placeholder="e.g. City, or full address" className="w-full mt-1 p-2 rounded border text-gray-800" />
              </label>
              <label className="block mb-3">
                <span className="text-sm text-gray-700">Service Time</span>
                <input type="text" name="rough_event_time" placeholder="e.g. Around 6pm, or 5–7pm" className="w-full mt-1 p-2 rounded border text-gray-800" />
              </label>
              <label className="block mb-3">
                <span className="text-sm text-gray-700">Estimated Guest Count</span>
                <input type="number" name="estimated_guests" min="1" required className="w-full mt-1 p-2 rounded border text-gray-800" />
              </label>
              <div className="grid grid-cols-2 gap-3 mb-1">
                <label className="block">
                  <span className="text-sm text-gray-700">Email</span>
                  <input type="email" name="email" autoComplete="email" className="w-full mt-1 p-2 rounded border text-gray-800" />
                </label>
                <label className="block">
                  <span className="text-sm text-gray-700">Phone</span>
                  <input type="tel" name="phone" autoComplete="tel" className="w-full mt-1 p-2 rounded border text-gray-800" />
                </label>
              </div>
              <p className="mb-3 text-xs text-gray-500">Either one works.</p>
              <label className="block mb-3">
                <span className="text-sm text-gray-700">How did you hear about us? (optional)</span>
                <input type="text" name="heard_about" placeholder="e.g. Instagram, a friend, Pizza Friday" className="w-full mt-1 p-2 rounded border text-gray-800" />
              </label>
              <label className="block mb-4">
                <span className="text-sm text-gray-700">Anything else? (optional)</span>
                <textarea name="comments" rows="3" className="w-full mt-1 p-2 rounded border text-gray-800" />
              </label>
              {error && (
                <p className="mb-3 text-sm text-red-600 font-medium">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-600 text-white font-bold text-lg py-3 rounded-lg hover:bg-amber-700 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending…' : 'Send It'}
              </button>
            </form>
            </>
            )}
          </div>
        </div>

    </div>
  )
}

export default Inquiries
