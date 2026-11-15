import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { tastingWhen } from '../Events/replyText'

// /tasting?t=<token>&i=<n>: where a couple lands from the tasting buttons in a
// quote email. They confirm a time (the one they tapped is picked already);
// functions/tasting.js saves it, emails them the details and tells Jaron.

const params = () => {
  try {
    return new URLSearchParams(window.location.search)
  } catch (e) {
    return new URLSearchParams()
  }
}

const Tasting = () => {
  const [info, setInfo] = useState(null)
  const [choice, setChoice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState('')

  useEffect(() => {
    if (navigator.userAgent === 'ReactSnap') return
    const p = params()
    httpsCallable(getFunctions(), 'tastingInfo')({ token: p.get('t') || '' })
      .then((res) => {
        const data = res.data
        setInfo(data)
        const tapped = data.times[Number(p.get('i'))]
        if (tapped && tapped.open) setChoice(tapped.at)
        if (data.picked) setDone(data.picked)
      })
      .catch((e) => setError(e.message || "This link doesn't work. Reply to the email and we'll sort it out."))
  }, [])

  const pick = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await httpsCallable(getFunctions(), 'pickTasting')({ token: params().get('t') || '', at: choice })
      setDone(res.data.picked)
    } catch (e) {
      setError(e.message || "Couldn't save that. Please try again, or reply to the email.")
    } finally {
      setBusy(false)
    }
  }

  const open = info ? info.times.filter((t) => t.open) : []
  return (
    <>
      <Helmet>
        <title>Pizza tasting | Backyard Brick Oven</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="bg-slate-200 min-h-screen">
        <div className="max-w-md mx-auto px-4 py-8 space-y-5 text-left">
          <h1 className="text-3xl font-extrabold text-gray-900 text-center">Pizza tasting</h1>
          {!info && !error && <p className="text-center text-gray-600">Loading…</p>}
          {error && !info && <p className="bg-white rounded-xl shadow-md p-5 text-gray-800">{error}</p>}

          {info && info.cancelled && (
            <div className="bg-white rounded-xl shadow-md p-6 space-y-2 text-center">
              <p className="text-xl font-bold text-gray-900">This tasting isn't scheduled anymore.</p>
              <p className="text-gray-600">If you have questions, just reply to the email.</p>
            </div>
          )}

          {info && done && !info.cancelled && (
            <div className="bg-white rounded-xl shadow-md p-6 space-y-3 text-center">
              <p className="text-xl font-bold text-gray-900">You're all set{info.name ? `, ${info.name}` : ''}!</p>
              <p className="text-gray-800">
                See you <b>{tastingWhen(done)}</b>.
              </p>
              <p className="text-gray-600">We emailed you the address and details. If something comes up, just reply to that email.</p>
            </div>
          )}

          {info && !done && !info.cancelled && (
            <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
              <p className="text-gray-800">
                {info.name ? `Hi ${info.name}! ` : ''}Pick a time for your free pizza tasting. It takes about {info.minutes === 60 ? 'an hour' : `${info.minutes} minutes`}.
              </p>
              {open.length === 0 ? (
                <p className="text-gray-700">These times have passed. Reply to the email and we'll find a new one.</p>
              ) : (
                <div className="space-y-2" role="radiogroup" aria-label="Tasting times">
                  {open.map((t) => (
                    <button
                      key={t.at}
                      type="button"
                      role="radio"
                      aria-checked={choice === t.at}
                      onClick={() => setChoice(t.at)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 font-semibold ${
                        choice === t.at ? 'border-amber-600 bg-amber-50 text-gray-900' : 'border-gray-200 text-gray-800 hover:border-gray-400'
                      }`}
                    >
                      {tastingWhen(t.at)}
                    </button>
                  ))}
                </div>
              )}
              {error && <p className="text-sm text-red-700">{error}</p>}
              {open.length > 0 && (
                <button
                  type="button"
                  disabled={!choice || busy}
                  onClick={pick}
                  className="w-full py-4 rounded-xl text-lg font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {busy ? 'Saving…' : 'Book this time'}
                </button>
              )}
              <p className="text-sm text-gray-500">None of these work? Just reply to the email with a couple of times that do.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Tasting
