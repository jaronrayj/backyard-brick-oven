import { findRow } from './choices'

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
