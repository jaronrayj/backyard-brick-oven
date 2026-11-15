import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import QuoteEmail from './QuoteEmail'

jest.mock('../../utils/db', () => ({ db: {} }))
const mockCall = jest.fn(() => Promise.resolve({ data: { ok: true } }))
jest.mock('firebase/functions', () => ({ getFunctions: () => ({}), httpsCallable: () => mockCall }))
jest.mock('firebase/firestore', () => ({
  doc: () => ({}),
  getDoc: () => Promise.resolve({ exists: () => false, data: () => ({}) }),
}))

const quote = { lines: [{ label: 'Party package', qty: 1, price: 375 }], discount: 0, taxRate: 7.25, depositPct: 25, footer: '' }
const event = { name: 'Mike Taylor', email: 'mike@example.com', eventType: 'Birthday or family party', date: '2027-03-20', quote }

beforeEach(() => mockCall.mockClear())

test('a new or changed event: Email the quote saves first, stays open, then sends', async () => {
  const onSave = jest.fn(() => Promise.resolve('new-id'))
  const onSent = jest.fn()
  render(<QuoteEmail id={undefined} event={event} initial={{}} onSave={onSave} onSent={onSent} />)
  expect(screen.getByText('Saves your changes first.')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Email the quote…'))
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
  const send = await screen.findByText('Send to mike@example.com')
  // Still unsaved as far as this component knows (its props didn't change), so Send saves again first.
  fireEvent.click(send)
  await waitFor(() => expect(mockCall).toHaveBeenCalledTimes(1))
  expect(mockCall.mock.calls[0][0].eventId).toBe('new-id')
  expect(mockCall.mock.calls[0][0].text).toMatch(/Party package/)
  await waitFor(() => expect(onSent).toHaveBeenCalled())
})

test('an already-saved event opens the email without saving', async () => {
  const onSave = jest.fn(() => Promise.resolve('e1'))
  render(<QuoteEmail id="e1" event={event} initial={event} onSave={onSave} onSent={() => {}} />)
  expect(screen.queryByText('Saves your changes first.')).not.toBeInTheDocument()
  fireEvent.click(screen.getByText('Email the quote…'))
  await screen.findByText('Send to mike@example.com')
  expect(onSave).not.toHaveBeenCalled()
  fireEvent.click(screen.getByText('Send to mike@example.com'))
  await waitFor(() => expect(mockCall).toHaveBeenCalledTimes(1))
  expect(onSave).not.toHaveBeenCalled()
  expect(mockCall.mock.calls[0][0].eventId).toBe('e1')
})

test('a save that fails keeps the email closed', async () => {
  const onSave = jest.fn(() => Promise.resolve(null))
  render(<QuoteEmail id="e1" event={{ ...event, guests: 1, name: 'Changed' }} initial={event} onSave={onSave} onSent={() => {}} />)
  fireEvent.click(screen.getByText('Email the quote…'))
  await waitFor(() => expect(onSave).toHaveBeenCalled())
  expect(screen.queryByText(/Send to/)).not.toBeInTheDocument()
})

test('no quote or no email: says what is missing', () => {
  const { rerender } = render(<QuoteEmail id="e1" event={{ ...event, quote: null }} initial={event} onSave={() => {}} onSent={() => {}} />)
  expect(screen.getByText('Build the quote first.')).toBeInTheDocument()
  rerender(<QuoteEmail id="e1" event={{ ...event, email: '' }} initial={event} onSave={() => {}} onSent={() => {}} />)
  expect(screen.getByText('Add their email address to send it.')).toBeInTheDocument()
})

test('tasting times: a date and a time in 15-minute steps, starting at 5 pm', async () => {
  // eslint-disable-next-line global-require
  const { TASTING_CLOCK } = require('./QuoteEmail')
  expect(TASTING_CLOCK[0]).toEqual({ value: '07:00', label: '7:00 am' })
  expect(TASTING_CLOCK[TASTING_CLOCK.length - 1]).toEqual({ value: '22:00', label: '10:00 pm' })
  expect(TASTING_CLOCK.every((c) => Number(c.value.slice(3)) % 15 === 0)).toBe(true)
  expect(TASTING_CLOCK.map((c) => c.label)).toContain('5:15 pm')

  const wedding = { ...event, name: 'Kate and Ryan', eventType: 'Wedding' }
  render(<QuoteEmail id="e1" event={wedding} initial={wedding} onSave={() => Promise.resolve('e1')} onSent={() => {}} />)
  fireEvent.click(screen.getByText('Email the quote…'))
  const time = await screen.findByLabelText('Tasting 1 time')
  expect(time.value).toBe('17:00')
  fireEvent.change(screen.getByLabelText('Tasting 1 date'), { target: { value: '2030-06-04' } })
  fireEvent.change(time, { target: { value: '18:45' } })
  fireEvent.click(screen.getByText('+ Add a time'))
  expect(screen.getByLabelText('Tasting 2 time').value).toBe('18:45')
  fireEvent.click(screen.getByText('Send to mike@example.com'))
  await waitFor(() => expect(mockCall).toHaveBeenCalled())
  const sent = mockCall.mock.calls[mockCall.mock.calls.length - 1][0].times
  expect(sent).toHaveLength(1) // the second row has no date yet
  expect(new Date(sent[0]).getMinutes()).toBe(45)
})
