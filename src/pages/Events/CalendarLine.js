import React, { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../utils/db'
import { ui } from '../../components/TeamPage'

// Where this event stands on the pizza events Google Calendar. The sync itself
// is functions/calendarSync.js: quoted -> tentative entry, booked -> confirmed,
// lost -> removed. "Add it now" / "Put it back" ask it to sync this event
// (calendar.revive), which also brings back an entry deleted in Google Calendar.

export const calendarState = (event) => {
  const e = event || {}
  const cal = e.calendar || {}
  const onCalendar = ['quoted', 'booked', 'done'].includes(e.status) && /^\d{4}-\d{2}-\d{2}$/.test(e.date || '')
  if (cal.manual && !cal.adopt) {
    return {
      text: 'Linked to the entry you put on your calendar, so the app leaves it alone (no travel or setup time).',
      action: 'Let the app manage it',
      field: 'adopt',
    }
  }
  if (cal.adopt) return { text: 'Updating your calendar entry…' }
  if (cal.optOut && !cal.revive) return { text: 'Off your calendar: the entry was deleted there.', action: 'Put it back on my calendar' }
  if (!onCalendar) {
    if (e.status === 'inquiry' || e.status === 'contacted') return { text: 'Goes on your calendar as tentative once it’s quoted and has a date.' }
    if (e.status === 'lost') return { text: cal.id && !cal.removed ? 'Coming off your calendar.' : 'Not on your calendar.' }
    return { text: 'Goes on your calendar once it has a date.' }
  }
  if (cal.revive) return { text: 'Adding it to your calendar…' }
  if (cal.error) return { text: `Couldn’t update your calendar (${cal.error}).`, action: 'Try again' }
  if (cal.sig && !cal.removed) {
    return { text: e.status === 'quoted' ? 'On your calendar as tentative. It’s confirmed there when you mark it Booked.' : 'On your calendar.' }
  }
  return { text: 'Not on your calendar yet.', action: 'Add it now' }
}

// "Put it back" / "Add it now" / "Try again" set calendar.revive; "Let the app
// manage it" sets calendar.adopt (take over the hand-made entry). Dot paths keep
// the entry's id, so a taken-over entry stays the same entry.
const CalendarLine = ({ id, event }) => {
  const [busy, setBusy] = useState(false)
  const [asked, setAsked] = useState(false)
  if (!id) return null
  const state = asked ? { text: 'Updating your calendar…' } : calendarState(event)
  const ask = async () => {
    setBusy(true)
    try {
      await updateDoc(doc(db, 'events', id), { [`calendar.${state.field || 'revive'}`]: true })
      setAsked(true)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="space-y-2">
      <h3 className="font-semibold">Calendar</h3>
      <div className="rounded-md p-3 bg-gray-50 space-y-2">
        <p className="text-sm text-gray-700">{state.text}</p>
        {state.action && (
          <button type="button" className={ui.btnQuiet} disabled={busy} onClick={ask}>
            {state.action}
          </button>
        )}
      </div>
    </section>
  )
}

export default CalendarLine
