import { money, totals } from './quote'
import { DEFAULT_QUOTE_EMAIL, dropOldSignOff, replyEventWords, tastingWhen } from './replyText'
import { reviewGreetingName } from './reviewAskText'

// The quote email, built in the event editor so the preview is exactly what's
// sent. Tasting buttons point at {{TASTING_0}}, {{TASTING_1}}…: the server
// (functions/tasting.js, sendQuoteEmail) swaps in each time's private link.

export const tastingLinkMark = (i) => `{{TASTING_${i}}}`

const n = (v) => Number(v) || 0
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const linkify = (html) => html.replace(/\b(backyardbrickovenpizza\.com(?:\/[\w\-/?=&;.#]*[\w/])?)/g, '<a href="https://$1">$1</a>')
const fullDate = (iso) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))
    ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
    : ''

// "your wedding on Saturday, June 12, 2027", or "your wedding" with no date.
export const quoteEventWords = (event) => {
  const words = replyEventWords(event && event.eventType)
  const date = fullDate(event && event.date)
  return date ? `${words} on ${date}` : words
}

// [label, amount] rows: each line, then subtotal/discount, tax, total, deposit.
export const quoteRows = (quote) => {
  const q = quote || {}
  const t = totals(q)
  const rows = (q.lines || [])
    .filter((l) => String(l.label || '').trim())
    .map((l) => {
      const qty = n(l.qty)
      return { label: `${String(l.label).trim()}${qty === 1 ? '' : ` (${qty} × ${money(n(l.price))})`}`, amount: money(qty * n(l.price)) }
    })
  if (t.discount) rows.push({ label: 'Subtotal', amount: money(t.subtotal) }, { label: 'Discount', amount: `−${money(t.discount)}` })
  if (t.tax) rows.push({ label: `Tax (${n(q.taxRate)}%)`, amount: money(t.tax) })
  rows.push({ label: 'Total', amount: money(t.total), strong: true })
  // Just the amount: a percent like 24.51% (set to land on $500) reads oddly to a customer.
  if (t.deposit) {
    rows.push({ label: 'Deposit to hold your date', amount: money(t.deposit) })
    // The deposit is before tax, so say where the tax goes.
    rows.push({ label: t.tax ? 'Balance due (includes the tax)' : 'Balance due', amount: money(t.balance) })
  }
  return rows
}

const quoteHtml = (quote) => {
  const rows = quoteRows(quote)
  const cell = 'padding:6px 0;border-bottom:1px solid #e5e7eb'
  const body = rows
    .map(
      (r) =>
        `<tr><td style="${cell}${r.strong ? ';font-weight:bold' : ''}">${esc(r.label)}</td><td style="${cell};text-align:right;white-space:nowrap${r.strong ? ';font-weight:bold' : ''}">${esc(r.amount)}</td></tr>`
    )
    .join('')
  const footer = String((quote && quote.footer) || '').trim()
  return `<table cellpadding="0" cellspacing="0" style="width:100%;max-width:520px;border-collapse:collapse;margin:0 0 16px">${body}</table>${
    footer ? `<p style="color:#4b5563;font-size:14px">${esc(footer).replace(/\n/g, '<br>')}</p>` : ''
  }`
}

const quoteTextBlock = (quote) => {
  const lines = quoteRows(quote).map((r) => `${r.strong ? '' : '- '}${r.label}: ${r.amount}`)
  const footer = String((quote && quote.footer) || '').trim()
  return [...lines, ...(footer ? ['', footer] : [])].join('\n')
}

const button = (href, label) =>
  `<a href="${href}" style="display:inline-block;background:#d97706;color:#ffffff;text-decoration:none;font-weight:bold;padding:10px 18px;border-radius:8px;margin:0 8px 8px 0">${esc(label)}</a>`

// The email: { subject, text, html }. times: ISO strings offered for a tasting.
export const renderQuoteEmail = ({ template, event, quote, times = [] }) => {
  const saved = { ...DEFAULT_QUOTE_EMAIL, ...(template || {}) }
  // The signature is added after (appendSignature); drop an old "Jaron / phone" sign-off.
  const t = { ...saved, body: dropOldSignOff(saved.body) }
  const fill = (s) =>
    String(s || '')
      .replace(/\{name\}/g, reviewGreetingName(event && event.name))
      .replace(/\{event\}/g, quoteEventWords(event))
  const offered = times.filter(Boolean)
  const labels = offered.map((iso) => tastingWhen(iso, { short: true }))

  // Plain text
  const tastingText = offered.length ? fill(t.tasting).replace(/\{times\}/g, labels.map((l, i) => `- ${l}: ${tastingLinkMark(i)}`).join('\n')) : ''
  const text = fill(t.body)
    .replace(/\{quote\}/g, quoteTextBlock(quote))
    .replace(/\{tasting\}/g, tastingText)
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // HTML: one block per paragraph; {quote}, {tasting} and {times} become their own blocks.
  const para = (p) => `<p>${linkify(esc(p)).replace(/\n/g, '<br>')}</p>`
  const blocks = (s, marks) =>
    s
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) =>
        marks[p] !== undefined
          ? marks[p]
          : Object.entries(marks)
              .reduce((h, [k, v]) => h.split(k).join(`</p>${v}<p>`), para(p))
              .replace(/<p>(\s|<br>)*<\/p>/g, '')
      )
      .filter(Boolean)
      .join('\n')
  const timesHtml = `<p>${offered.map((_, i) => button(tastingLinkMark(i), labels[i])).join('')}</p>`
  const tastingHtml = offered.length ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:4px 16px;margin:0 0 16px">${blocks(fill(t.tasting), { '{times}': timesHtml })}</div>` : ''
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#111827;max-width:560px">${blocks(fill(t.body), {
    '{quote}': quoteHtml(quote),
    '{tasting}': tastingHtml,
  })}</div>`

  return { subject: fill(t.subject).replace(/\s+/g, ' ').trim(), text: `${text}\n`, html }
}
