import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import { DEFAULT_PRICING, publicPricing } from '../pages/Events/quote'

// Prices for the public pages, from Firestore `publicSettings/site` (written
// when Events > Pricing is saved). Starts with the defaults so the prerendered
// page and the first render match; the prerender itself doesn't fetch.
const usePublicPricing = () => {
  const [pricing, setPricing] = useState(() => publicPricing(DEFAULT_PRICING))
  useEffect(() => {
    if (navigator.userAgent === 'ReactSnap') return undefined
    let live = true
    getDoc(doc(db, 'publicSettings', 'site'))
      .then((snap) => live && snap.exists() && setPricing((p) => ({ ...p, ...snap.data() })))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])
  return pricing
}

export default usePublicPricing
