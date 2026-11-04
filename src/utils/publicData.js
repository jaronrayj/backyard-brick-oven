import { firebaseConfig } from './firebase'

// Public data over plain HTTPS: no Firestore or Realtime Database libraries
// on the public pages. Both are readable by anyone (firestore.rules,
// database.rules.json).

// Realtime Database path as JSON, e.g. rtdbGet('pizzas').
export const rtdbGet = async (path) => {
  const res = await fetch(`${firebaseConfig.databaseURL.replace(/\/$/, '')}/${path}.json`)
  if (!res.ok) throw new Error(`RTDB ${path}: ${res.status}`)
  return res.json()
}

// Firestore REST values -> plain JS.
const plain = (v) => {
  if (!v) return null
  if ('stringValue' in v) return v.stringValue
  if ('booleanValue' in v) return v.booleanValue
  if ('integerValue' in v) return Number(v.integerValue)
  if ('doubleValue' in v) return v.doubleValue
  if ('nullValue' in v) return null
  if ('timestampValue' in v) return v.timestampValue
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(plain)
  if ('mapValue' in v) return fields(v.mapValue.fields)
  return null
}
const fields = (f) => Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, plain(v)]))

// One Firestore document, e.g. firestoreGet('publicSettings/site'); null if missing.
export const firestoreGet = async (path) => {
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${path}?key=${firebaseConfig.apiKey}`
  const res = await fetch(url)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Firestore ${path}: ${res.status}`)
  return fields((await res.json()).fields)
}
