import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../utils/db'
import AdminOnly from './AdminOnly'
import Report from './Report'

// /admin/report, on the team home: website visitors and how inquiries turned out.
const Live = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  useEffect(
    () => onSnapshot(collection(db, 'events'), (snap) => setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
    []
  )
  return <Report events={events} onClose={() => navigate('/team')} closeLabel="Back to team home" />
}

const ReportPage = () => (
  <AdminOnly title="Report">
    <Live />
  </AdminOnly>
)

export default ReportPage
