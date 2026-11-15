import { quoteEventWords, quoteRows, renderQuoteEmail, tastingLinkMark } from './quoteEmailText'
import { DEFAULT_QUOTE_EMAIL } from './replyText'

const event = { name: 'Kate and Ryan', eventType: 'Wedding', date: '2027-06-12' }
const quote = {
  lines: [
    { label: 'Wedding package (up to 100 guests)', qty: 1, price: 1500 },
    { label: 'Salad', qty: 85, price: 3 },
    { label: '', qty: 1, price: 0 },
  ],
  discount: 0,
  taxRate: 7.25,
  depositPct: 25,
  footer: 'Prices good for 30 days.',
}
const times = ['2026-11-18T02:00:00.000Z', '2026-11-20T02:30:00.000Z']

test('event words and quote rows', () => {
  expect(quoteEventWords(event)).toBe('your wedding on Saturday, June 12, 2027')
  expect(quoteEventWords({ eventType: 'Holiday party' })).toBe('your party')
  const rows = quoteRows(quote).map((r) => `${r.label}: ${r.amount}`)
  expect(rows).toEqual([
    'Wedding package (up to 100 guests): $1,500.00',
    'Salad (85 × $3.00): $255.00',
    'Tax (7.25%): $127.24',
    'Total: $1,882.24',
    'Deposit to hold your date: $438.75',
    'Balance due (includes the tax): $1,443.49',
  ])
})

test('the quote email with tasting times', () => {
  const mail = renderQuoteEmail({ template: DEFAULT_QUOTE_EMAIL, event, quote, times })
  expect(mail.subject).toBe('Your Backyard Brick Oven quote 🍕')
  expect(mail.text).toMatch(/^Hi Kate and Ryan,\n\nHere's your quote for your wedding on Saturday, June 12, 2027:\n\n- Wedding package/)
  expect(mail.text).toMatch(/Total: \$1,882\.24/)
  expect(mail.text).toMatch(/- Tue, Nov 17 · 7:00 pm: \{\{TASTING_0\}\}\n- Thu, Nov 19 · 7:30 pm: \{\{TASTING_1\}\}/)
  expect(mail.text).toMatch(/Prices good for 30 days\./)
  expect(mail.html).toContain(`href="${tastingLinkMark(0)}"`)
  expect(mail.html).toContain(`href="${tastingLinkMark(1)}"`)
  expect(mail.html).toMatch(/<td[^>]*font-weight:bold[^>]*>Total<\/td>/)
  expect(mail.html).not.toMatch(/\{quote\}|\{tasting\}|\{times\}/)
  expect(mail.text + mail.html).not.toMatch(/wood/i)
})

test('no times: no tasting invite at all', () => {
  const mail = renderQuoteEmail({ template: DEFAULT_QUOTE_EMAIL, event, quote, times: [] })
  expect(mail.text).not.toMatch(/tasting/i)
  expect(mail.html).not.toMatch(/tasting|TASTING_/i)
  expect(mail.text).not.toMatch(/\n{3,}/)
})

test('{quote} in the middle of a sentence still becomes the table', () => {
  const mail = renderQuoteEmail({ template: { ...DEFAULT_QUOTE_EMAIL, body: 'Hi {name}, here it is: {quote} Thanks!' }, event, quote, times: [] })
  expect(mail.html).toMatch(/here it is: <\/p><table/)
  expect(mail.html).toMatch(/<\/table>.*<p> Thanks!<\/p>/s)
})
