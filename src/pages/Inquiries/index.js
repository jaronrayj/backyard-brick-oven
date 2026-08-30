import React from 'react'
import { Helmet } from 'react-helmet-async'
import nightPizza from '../../assets/night_pizza.jpg'
import pizzaParty from '../../assets/pizza_party.jpg'

const Inquiries = () => {
  const [showForm, setShowForm] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setShowForm(false) }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

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
            We bring a brick oven right to you — hot, fresh, Neapolitan-style pizza
            with no long lines and zero cleanup for you.
          </p>
          <button
            onClick={() => setShowForm(true)}
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
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-2xl font-bold mb-4">What We Bring to You</h2>
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
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-2xl font-bold mb-1">Simple. Stress-Free. Done.</h2>
            <p className="text-gray-600 mb-5">Three steps and you're set.</p>
            <div className="space-y-4">
              {[
                ['1', 'Tell us about your event', 'Date, guest count, and location — that\'s all we need to start.'],
                ['2', 'We plan it with you', 'Pick from our pizzas or build a custom menu together.'],
                ['3', 'We show up & cook', 'We handle everything so you can enjoy your event.'],
              ].map(([num, title, desc]) => (
                <div key={num} className="flex items-start">
                  <div className="bg-yellow-500 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold shrink-0 mr-3">
                    {num}
                  </div>
                  <div>
                    <h3 className="font-bold">{title}</h3>
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
            Birthdays, weddings, corporate events, graduations, neighborhood
            parties — groups of 25–200. We run continuous service with rotating
            pizzas, so guests grab fresh slices anytime with no long waits.
          </p>
        </div>

        {/* Pizza Classes */}
        <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-xl p-6 md:p-8 shadow-md border-2 border-orange-300">
          <div className="md:flex gap-8 items-center">
            <img
              src={nightPizza}
              alt="Hands-on pizza class"
              className="rounded-xl md:w-1/2 mb-6 md:mb-0 object-cover max-h-64 w-full"
            />
            <div className="text-gray-700 space-y-3">
              <h2 className="text-2xl font-bold">Want to Make Your Own Pizza?</h2>
              <p>
                Hands-on pizza classes for groups of 8–30 — perfect for date
                nights, team events, or a fun night with friends.
              </p>
              <p>
                You'll learn dough stretching, topping combos, and how to cook in
                a real brick oven. Everyone makes (and eats) their own. We bring
                everything — you just show up hungry.
              </p>
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
              Tell us a little about your event and we'll take it from there.
            </p>
            <button
              onClick={() => setShowForm(true)}
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
                setSubmitting(true)
                try {
                  const payload = Object.fromEntries(new FormData(form))
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
                <input type="text" name="event_type" required placeholder="e.g. Birthday, Wedding, Corporate, Pizza Class" className="w-full mt-1 p-2 rounded border text-gray-800" />
              </label>
              <label className="block mb-3">
                <span className="text-sm text-gray-700">Who's the event for?</span>
                <input type="text" name="event_for" required placeholder="e.g. Myself, my daughter, our company" className="w-full mt-1 p-2 rounded border text-gray-800" />
              </label>
              <label className="block mb-3">
                <span className="text-sm text-gray-700">Event Date</span>
                <input type="date" name="event_date" required className="w-full mt-1 p-2 rounded border text-gray-800" />
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
              <label className="block mb-3">
                <span className="text-sm text-gray-700">Email or Phone</span>
                <input type="text" name="contact" required className="w-full mt-1 p-2 rounded border text-gray-800" />
              </label>
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
