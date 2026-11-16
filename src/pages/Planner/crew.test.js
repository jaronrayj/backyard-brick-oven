import { mountPlanner } from './planner'

const fakeStore = (docs) => {
  const saved = {}
  return {
    saved,
    doc: (path) => ({
      set: (data) => {
        saved[path] = data
        return Promise.resolve()
      },
      onSnapshot: (next) => {
        const data = docs[path]
        next({ exists: !!data, data: () => data, metadata: { hasPendingWrites: false, fromCache: false } })
        return () => {}
      },
    }),
  }
}
const REF = { settings: [], recipe: [], menu: [], nights: [], amounts: [], sauces: [], sections: [], at: 1 }
const iso = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const settle = async () => {
  jest.advanceTimersByTime(1000)
  for (let i = 0; i < 5; i += 1) await Promise.resolve()
}
const plan = () => ({
  services: [{ id: 'pf1', date: iso(5), type: 'pf', crew: [{ id: 'c1', name: 'Libby', from: '16:00', to: '20:00', status: 'yes' }] }],
  crewNames: ['Ben', 'Libby'],
})

test('admins: add someone (times copy the last row), set maybe, saved with the plan', async () => {
  jest.useFakeTimers()
  const store = fakeStore({ 'ref/snapshot': REF, 'plan/current': plan() })
  const root = document.createElement('div')
  document.body.appendChild(root)
  const stop = mountPlanner(root, { store, canWrite: true, pizzas: () => () => {} })
  await settle()

  const box = root.querySelector('.crew[data-svc="pf1"]')
  expect(box.querySelector('.crew-head .sub').textContent).toBe('1 confirmed')
  // Names used before are offered.
  expect([...root.querySelectorAll('#crew-names option')].map((o) => o.value)).toEqual(['Ben', 'Libby'])

  ;[...box.querySelectorAll('button')].find((b) => b.textContent === '+ Add someone').click()
  const rows = box.querySelectorAll('.crew-row')
  expect(rows).toHaveLength(2)
  const [name, from, to, status] = rows[1].querySelectorAll('input, select')
  expect([from.value, to.value]).toEqual(['16:00', '20:00'])
  name.value = 'Ben'
  name.dispatchEvent(new Event('input', { bubbles: true }))
  name.dispatchEvent(new Event('change', { bubbles: true }))
  from.value = '17:30'
  from.dispatchEvent(new Event('change', { bubbles: true }))
  status.value = 'maybe'
  status.dispatchEvent(new Event('change', { bubbles: true }))
  expect(box.querySelector('.crew-head .sub').textContent).toBe('1 confirmed · 1 maybe')
  // Times go in 15-minute steps.
  expect([...from.options].map((o) => o.value).filter(Boolean).every((v) => Number(v.slice(3)) % 15 === 0)).toBe(true)
  await settle()

  const crew = store.saved['plan/current'].services[0].crew
  expect(crew.map((c) => [c.name, c.from, c.to, c.status])).toEqual([
    ['Libby', '16:00', '20:00', 'yes'],
    ['Ben', '17:30', '20:00', 'maybe'],
  ])
  if (typeof stop === 'function') stop()
  jest.useRealTimers()
})

test('crew see the schedule but can’t change it', async () => {
  jest.useFakeTimers()
  const store = fakeStore({ 'ref/snapshot': REF, 'plan/current': plan() })
  const root = document.createElement('div')
  const stop = mountPlanner(root, { store, canWrite: false, canCheck: true, shopping: false, pizzas: () => () => {} })
  await settle()
  const box = root.querySelector('.crew[data-svc="pf1"]')
  expect(box.querySelector('.crew-row input').value).toBe('Libby')
  expect([...box.querySelectorAll('input, select, button')].every((x) => x.disabled)).toBe(true)
  if (typeof stop === 'function') stop()
  jest.useRealTimers()
})
