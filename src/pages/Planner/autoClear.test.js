import { mountPlanner } from './planner'

// A stand-in for Firestore: each doc remembers what the planner saved.
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

const iso = (offsetDays) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

test('finished services clear themselves; today, upcoming and undated stay', async () => {
  jest.useFakeTimers()
  const store = fakeStore({
    'plan/current': {
      services: [
        { id: 'last-night', date: iso(-1), type: 'pf' },
        { id: 'last-week', date: iso(-8), type: 'pf' },
        { id: 'today', date: iso(0), type: 'pf' },
        { id: 'next', date: iso(6), type: 'wedding', guests: 120 },
        { id: 'undated', date: '', type: 'sides' },
      ],
      prepExtras: [{ name: 'Slice basil', date: iso(-1) }],
    },
  })
  const root = document.createElement('div')
  document.body.appendChild(root)
  const stop = mountPlanner(root, { store, canWrite: true, pizzas: () => () => {} })
  jest.advanceTimersByTime(1000)
  for (let i = 0; i < 5; i += 1) await Promise.resolve() // let the save finish
  expect(store.saved['plan/current'].services.map((s) => s.id)).toEqual(['today', 'next', 'undated'])
  // Own prep items stay, so unchecked ones still show under "Missed".
  expect(store.saved['plan/current'].prepExtras).toHaveLength(1)
  if (typeof stop === 'function') stop()
  jest.useRealTimers()
})

test('nothing finished: nothing is saved', async () => {
  jest.useFakeTimers()
  const store = fakeStore({ 'plan/current': { services: [{ id: 'next', date: iso(3), type: 'pf' }] } })
  const root = document.createElement('div')
  const stop = mountPlanner(root, { store, canWrite: true, pizzas: () => () => {} })
  jest.advanceTimersByTime(1000)
  for (let i = 0; i < 5; i += 1) await Promise.resolve() // let the save finish
  expect(store.saved['plan/current']).toBeUndefined()
  if (typeof stop === 'function') stop()
  jest.useRealTimers()
})

test("a copy from this device's cache is never saved over the server's plan", async () => {
  jest.useFakeTimers()
  const saved = {}
  let deliver = null
  const store = {
    doc: (path) => ({
      set: (data) => {
        saved[path] = data
        return Promise.resolve()
      },
      onSnapshot: (next) => {
        if (path === 'plan/current') deliver = next
        else next({ exists: false, data: () => undefined, metadata: { hasPendingWrites: false, fromCache: false } })
        return () => {}
      },
    }),
  }
  const root = document.createElement('div')
  const stop = mountPlanner(root, { store, canWrite: true, pizzas: () => () => {} })
  // An old cached plan with a finished service: shown, but not saved.
  const old = { services: [{ id: 'last-week', date: iso(-8), type: 'pf' }, { id: 'next', date: iso(6), type: 'pf' }] }
  deliver({ exists: true, data: () => old, metadata: { hasPendingWrites: false, fromCache: true } })
  jest.advanceTimersByTime(1000)
  for (let i = 0; i < 5; i += 1) await Promise.resolve()
  expect(saved['plan/current']).toBeUndefined()
  // The server answers with the real plan: now finished services are cleared and saved.
  const real = { services: [{ id: 'last-week', date: iso(-8), type: 'pf' }, { id: 'new', date: iso(2), type: 'wedding' }] }
  deliver({ exists: true, data: () => real, metadata: { hasPendingWrites: false, fromCache: false } })
  jest.advanceTimersByTime(1000)
  for (let i = 0; i < 5; i += 1) await Promise.resolve()
  expect(saved['plan/current'].services.map((s) => s.id)).toEqual(['new'])
  if (typeof stop === 'function') stop()
  jest.useRealTimers()
})
