import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Signups, { signupsCsv } from './Signups'

const at = (iso) => ({ toDate: () => new Date(iso) })
const mockRows = [
  { id: 'a', name: 'Sam, Jr', contact: '+18018723439', contactType: 'phone', consent: true, code: 'BYBO-K7QM', createdAt: at('2026-11-14T03:00:00Z'), source: 'hello' },
  { id: 'b', name: '=HYPERLINK("x")', contact: 'a@b.com', contactType: 'email', consent: false, code: 'BYBO-AAAA', createdAt: null, source: 'hello' },
]

jest.mock('../../utils/db', () => ({ db: {} }))
jest.mock('firebase/firestore', () => ({
  collection: () => ({}),
  orderBy: () => ({}),
  query: () => ({}),
  onSnapshot: (q, next) => {
    next({ docs: mockRows.map(({ id, ...data }) => ({ id, data: () => data })) })
    return () => {}
  },
}))

test('CSV has a header, one row each, quotes and no formulas', () => {
  const lines = signupsCsv(mockRows).trim().split('\n')
  expect(lines[0]).toBe('Name,Phone or email,Type,OK to text,Code,Signed up,Source')
  expect(lines[1]).toBe('"Sam, Jr",+18018723439,phone,yes,BYBO-K7QM,2026-11-14T03:00:00.000Z,hello')
  expect(lines[2]).toBe(`"'=HYPERLINK(""x"")",a@b.com,email,,BYBO-AAAA,,hello`)
})

test('the list shows each person, how to reach them and their code', () => {
  render(<Signups onClose={() => {}} />)
  expect(screen.getByText('2 people · 1 OK to text · 1 by email')).toBeInTheDocument()
  expect(screen.getByText('(801) 872-3439').getAttribute('href')).toBe('sms:+18018723439')
  expect(screen.getByText('a@b.com').getAttribute('href')).toBe('mailto:a@b.com')
  expect(screen.getByText('OK to text')).toBeInTheDocument()
  expect(screen.getByText('BYBO-K7QM')).toBeInTheDocument()
  expect(screen.getByText('Download CSV')).not.toBeDisabled()
})
