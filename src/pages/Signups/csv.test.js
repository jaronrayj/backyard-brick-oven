import { signupsCsv } from './csv'

test('signups CSV: header, quoting, and no spreadsheet formulas', () => {
  const at = { toDate: () => new Date('2026-11-14T21:00:00Z') }
  const csv = signupsCsv([
    { email: 'sam@example.com', name: 'Sam, Jr.', createdAt: at, source: 'hello' },
    { email: 'x@y.co', name: '=HYPERLINK("bad")', createdAt: null, source: 'hello' },
  ])
  expect(csv).toBe(
    'Email,First name,Signed up,Source\n' +
      'sam@example.com,"Sam, Jr.",2026-11-14T21:00:00.000Z,hello\n' +
      'x@y.co,"\'=HYPERLINK(""bad"")",,hello\n'
  )
})
