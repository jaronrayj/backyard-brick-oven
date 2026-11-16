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

test('cleared services keep their crew for the wrap-up', async () => {
  jest.useFakeTimers()
  const yesterday = iso(-1)
  const store = fakeStore({
    'ref/snapshot': REF,
    'plan/current': {
      services: [
        { id: 'old', date: yesterday, type: 'pf', crew: [{ id: 'a', name: 'Libby', from: '16:00', to: '20:00', status: 'yes' }] },
        { id: 'next', date: iso(3), type: 'pf', crew: [] },
      ],
    },
  })
  const root = document.createElement('div')
  const stop = mountPlanner(root, { store, canWrite: true, pizzas: () => () => {} })
  await settle()
  const saved = store.saved['plan/current']
  expect(saved.services.map((s) => s.id)).toEqual(['next'])
  expect(saved.crewLog[yesterday][0].crew.map((c) => c.name)).toEqual(['Libby'])
  // The wrap-up for yesterday's Pizza Friday gets that crew.
  expect(root.plannerWrapInfo({ date: yesterday, name: 'Pizza Friday' }).crew.map((c) => c.name)).toEqual(['Libby'])
  // A prep-day wrap-up has none.
  expect(root.plannerWrapInfo({ date: yesterday, name: 'Prep day' })).toBe(null)
  if (typeof stop === 'function') stop()
  jest.useRealTimers()
})

// Sign-ups: a stand-in for the crewSignups collection.
const fakeSignups = (initial) => {
  let listener = () => {}
  let list = initial
  const api = {
    listen: (next) => {
      listener = next
      next(list)
      return () => {}
    },
    save: jest.fn((svc, t) => {
      list = [...list.filter((x) => !(x.serviceId === svc.id && x.uid === 'u-ben')), { id: `${svc.id}__u-ben`, serviceId: svc.id, uid: 'u-ben', name: 'Ben', ...t }]
      listener(list)
      return Promise.resolve()
    }),
    remove: jest.fn((id) => {
      list = list.filter((x) => x.id !== id)
      listener(list)
      return Promise.resolve()
    }),
  }
  return api
}

test("crew: I'm planning to come, change times, can't make it", async () => {
  jest.useFakeTimers()
  const store = fakeStore({ 'ref/snapshot': REF, 'plan/current': plan() })
  const signups = fakeSignups([])
  const root = document.createElement('div')
  document.body.appendChild(root)
  const stop = mountPlanner(root, { store, canWrite: false, canCheck: true, shopping: false, me: { uid: 'u-ben', name: 'Ben' }, signups, pizzas: () => () => {} })
  await settle()
  const box = () => root.querySelector('.crew[data-svc="pf1"]')
  const button = (text) => [...box().querySelectorAll('button')].find((b) => b.textContent === text)

  // Usable even though the rest of the plan is read-only for crew.
  expect(button("I'm planning to come").disabled).toBe(false)
  button("I'm planning to come").click()
  const [from, to] = box().querySelectorAll('.self select')
  expect([from.value, to.value]).toEqual(['16:00', '20:00']) // like the crew already listed
  from.value = '17:30'
  button("I'm coming").click()
  await settle()
  expect(signups.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'pf1' }), { from: '17:30', to: '20:00' })
  expect(box().textContent).toMatch(/You're planning to come: 5:30–8 pm/)
  // Nothing about the plan itself was saved by crew.
  expect(store.saved['plan/current']).toBeUndefined()

  button("Can't make it").click()
  await settle()
  expect(signups.remove).toHaveBeenCalledWith('pf1__u-ben')
  expect(button("I'm planning to come")).toBeTruthy()
  if (typeof stop === 'function') stop()
  jest.useRealTimers()
})

test('admins: see who signed up and add them to the crew', async () => {
  jest.useFakeTimers()
  const store = fakeStore({ 'ref/snapshot': REF, 'plan/current': plan() })
  const signups = fakeSignups([{ id: 'pf1__u-ben', serviceId: 'pf1', uid: 'u-ben', name: 'Ben', from: '17:30', to: '20:00' }])
  const root = document.createElement('div')
  const stop = mountPlanner(root, { store, canWrite: true, me: { uid: 'u-admin', name: 'Jaron' }, signups, pizzas: () => () => {} })
  await settle()
  const box = root.querySelector('.crew[data-svc="pf1"]')
  expect(box.querySelector('.crew-head .sub').textContent).toBe('1 confirmed · 1 signed up')
  expect(box.querySelector('.signups').textContent).toMatch(/Ben 5:30–8 pm/)
  // Admins don't get a sign-up button for themselves.
  expect([...box.querySelectorAll('button')].some((b) => /planning to come/.test(b.textContent))).toBe(false)
  ;[...box.querySelectorAll('button')].find((b) => b.textContent === 'Add to crew').click()
  await settle()
  expect(signups.remove).toHaveBeenCalledWith('pf1__u-ben')
  expect(store.saved['plan/current'].services[0].crew.map((c) => [c.name, c.from, c.to, c.status])).toEqual([
    ['Libby', '16:00', '20:00', 'yes'],
    ['Ben', '17:30', '20:00', 'yes'],
  ])
  if (typeof stop === 'function') stop()
  jest.useRealTimers()
})
