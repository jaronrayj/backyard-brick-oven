import { getDatabase } from 'firebase/database'
import { getFirestore } from 'firebase/firestore'
import { app } from './firebase'

// Database clients for the team pages. Public pages read the little they need
// over plain HTTPS instead (utils/publicData.js), to keep these libraries out
// of the main bundle.
export const db = getFirestore(app)
export const rtdb = getDatabase(app)
