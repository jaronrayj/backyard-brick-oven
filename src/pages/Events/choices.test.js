import { findRow, yourNotes } from './choices'

const rows = [
  { row: 9, date: '2026-11-06', name: 'Pizza Friday' },
  { row: 8, date: '2026-11-06', name: 'Prep' },
  { row: 7, date: '2026-11-04', name: 'Prep' },
  { row: 6, date: '2026-11-04', name: 'Prep' },
  { row: 5, date: '2026-11-03', name: 'Jim karper business' },
]

test('opens the one row with the same date and name, ignoring case', () => {
  expect(findRow(rows, { date: '2026-11-06', name: 'pizza friday ' }).row.row).toBe(9)
})

test('asks to pick when several rows could be it', () => {
  expect(findRow(rows, { date: '2026-11-04', name: 'Prep' })).toEqual({ row: null, sameDay: 2 })
})

test('asks to pick rather than guess when the name differs', () => {
  expect(findRow(rows, { date: '2026-11-03', name: 'Karper work party' })).toEqual({ row: null, sameDay: 1 })
})

test('finds nothing when no row has that date', () => {
  expect(findRow(rows, { date: '2026-10-30', name: 'Pizza Friday' })).toEqual({ row: null, sameDay: 0 })
})

test('wrap-up notes drop the lines the app writes on the calendar', () => {
  const cal = [
    'Booked.',
    'Leave by 11:15 AM (45 min drive, 30 mi)',
    'Set up from 12:00 PM',
    'SERVICE 1:00 PM–8:00 PM',
    'Pack up until 8:45 PM',
    'Home about 9:30 PM, clean up until 10:15 PM',
    '',
    'Type: Pizza is the meal',
    'Guests: 800',
    'Jeremy Beck · 801-555-0100',
    'Open in Events: https://backyardbrickovenpizza.com/events?event=abc',
    '',
    'Bring the extra canopy',
  ].join('\n')
  expect(yourNotes(cal, { name: 'Jeremy Beck' })).toBe('Bring the extra canopy')
  expect(yourNotes('Pizza prep at Sabone')).toBe('Pizza prep at Sabone')
})
