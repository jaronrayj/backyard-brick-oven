import { useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../utils/firebase'

// Events and wrap-ups are for admins: emails in Firestore `plannerAccess/team` admins.
// access: null while checking, true, or 'denied'.
const useEventAdmin = () => {
  const [user, loading] = useAuthState(auth)
  const [access, setAccess] = useState(null)

  useEffect(() => {
    if (!user) {
      setAccess(null)
      return
    }
    const email = (user.email || '').toLowerCase()
    getDoc(doc(db, 'plannerAccess', 'team'))
      .then((snap) => {
        const admins = ((snap.data() || {}).admins || []).map((e) => String(e).toLowerCase())
        setAccess(admins.includes(email) ? true : 'denied')
      })
      .catch(() => setAccess('denied'))
  }, [user])

  return { user, loading: loading || (!!user && access === null), access }
}

export default useEventAdmin
