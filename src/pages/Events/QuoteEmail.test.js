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
