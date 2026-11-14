import { calendarState } from './CalendarLine'

jest.mock('../../utils/db', () => ({ db: {} }))

const ev = { status: 'quoted', date: '2027-04-17' }

test('what the editor says about the calendar', () => {
  expect(calendarState({ ...ev, calendar: { id: 'g', sig: 's' } }).text).toMatch(/tentative/)
  expect(calendarState({ ...ev, status: 'booked', calendar: { id: 'g', sig: 's' } }).text).toBe('On your calendar.')
  expect(calendarState(ev).action).toBe('Add it now')
  expect(calendarState({ ...ev, calendar: { id: 'g', optOut: true } }).action).toBe('Put it back on my calendar')
  expect(calendarState({ ...ev, calendar: { id: 'mine', manual: true } }).action).toBeUndefined()
  expect(calendarState({ ...ev, calendar: { error: '403' } }).action).toBe('Try again')
  expect(calendarState({ status: 'inquiry', date: '2027-04-17' }).text).toMatch(/once it’s quoted/)
  expect(calendarState({ ...ev, date: '' }).text).toMatch(/once it has a date/)
  expect(calendarState({ ...ev, status: 'lost', calendar: { id: 'g', sig: 's' } }).text).toBe('Coming off your calendar.')
})
