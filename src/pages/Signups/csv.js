// CSV for the /admin/signups download. Kept apart from the page so it tests without Firebase.

const when = (t) => (t && typeof t.toDate === 'function' ? t.toDate() : null)

// One CSV cell: quoted when needed, and never starting like a spreadsheet formula.
const cell = (value) => {
  let s = String(value == null ? '' : value)
  if (/^[=+\-@]/.test(s)) s = `'${s}`
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const signupsCsv = (rows) => {
  const head = ['Email', 'First name', 'Signed up', 'Source']
  const lines = rows.map((r) => {
    const d = when(r.createdAt)
    return [r.email, r.name, d ? d.toISOString() : '', r.source].map(cell).join(',')
  })
  return [head.join(','), ...lines].join('\n') + '\n'
}
