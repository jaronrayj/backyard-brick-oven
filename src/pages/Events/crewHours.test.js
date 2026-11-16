import { crewHours } from './WrapUp'

jest.mock('../../utils/firebase', () => ({ signInWithGoogle: () => {}, auth: {} }))
jest.mock('../../utils/db', () => ({ db: {} }))
jest.mock('firebase/functions', () => ({ getFunctions: () => ({}), httpsCallable: () => () => Promise.resolve({ data: {} }) }))

const headers = ['Timestamp', 'Pizza Friday or event', 'My hours', 'Libby hours', 'Ben Jones hours', 'Or employee cost']

test('confirmed crew fill their hours column', () => {
  const r = crewHours(headers, [
    { name: 'Jaron', from: '15:00', to: '21:30', status: 'yes' },
    { name: 'Libby', from: '16:00', to: '20:30' },
    { name: 'Ben', from: '17:15', to: '20:00', status: 'yes' },
  ])
  expect(r.fill).toEqual({ 'My hours': 6.5, 'Libby hours': 4.5, 'Ben Jones hours': 2.75 })
  expect(r.missing).toEqual([])
})

test('maybes, missing columns, missing times and past midnight', () => {
  const r = crewHours(headers, [
    { name: 'Hazel', from: '16:00', to: '20:00', status: 'yes' },
    { name: 'Libby', from: '20:00', to: '00:30', status: 'yes' },
    { name: 'Me', from: '', to: '20:00' },
    { name: 'Julia', from: '16:00', to: '20:00', status: 'maybe' },
    { name: '  ' },
  ])
  expect(r.fill).toEqual({ 'Libby hours': 4.5 })
  expect(r.missing).toEqual(['Hazel'])
  expect(r.maybes).toEqual(['Julia'])
})
