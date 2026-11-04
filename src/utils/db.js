import { getDatabase } from 'firebase/database'
import { enableMultiTabIndexedDbPersistence, getFirestore } from 'firebase/firestore'
import { app } from './firebase'

// Database clients for the team pages. Public pages read the little they need
// over plain HTTPS instead (utils/publicData.js), to keep these libraries out
// of the main bundle.
export const db = getFirestore(app)
// Keep a copy on the device: pages show the last data at once (even on a weak
// signal) and update when the server answers. Fails quietly where IndexedDB
// isn't available (private windows), which just means no head start.
enableMultiTabIndexedDbPersistence(db).catch(() => {})
export const rtdb = getDatabase(app)
