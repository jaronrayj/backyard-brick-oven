import { mountPlanner } from './planner'

// A stand-in for Firestore that remembers what was saved.
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
const iso = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

test('crew: the plan is view-only, but checking things off still saves', async () => {
  jest.useFakeTimers()
  const store = fakeStore({
    // A bare recipe/menu snapshot is enough for the lists to draw.
    'ref/snapshot': { settings: [], recipe: [], menu: [], nights: [], amounts: [], sauces: [], sections: [], at: 1 },
    'plan/current': {
      services: [{ id: 'old', date: iso(-2), type: 'pf' }, { id: 'next', date: iso(3), type: 'pf' }],
      extras: [{ name: 'Paper plates', qty: '' }],
      prepExtras: [{ name: 'Slice basil', date: iso(1) }],
    },
  })
  const root = document.createElement('div')
  document.body.appendChild(root)
  const stop = mountPlanner(root, { store, canWrite: false, canCheck: true, shopping: false, pizzas: () => () => {} })
  jest.advanceTimersByTime(1000)
  for (let i = 0; i < 5; i += 1) await Promise.resolve()

  // Nothing about the plan is saved by crew, not even clearing old services.
  expect(store.saved['plan/current']).toBeUndefined()
  expect(root.querySelector('#readonly').hidden).toBe(false)
  expect(root.querySelector('#readonly').textContent).toBe('Only admins change the plan. You can check things off on Prep and Bring.')
  // No Shopping tab for crew.
  expect(root.querySelector('#tab-shop').hidden).toBe(true)
  expect(root.querySelector('#tab-prep').hidden).toBe(false)
  expect(root.querySelector('#add-svc').disabled).toBe(true)
  expect(root.querySelector('#shop-add').disabled).toBe(true)

  // Checkboxes work and save to the check list.
  const boxes = [...root.querySelectorAll('.item input[type=checkbox]')]
  expect(boxes.length).toBeGreaterThan(0)
  expect(boxes.every((b) => !b.disabled)).toBe(true)
  boxes[0].click()
  for (let i = 0; i < 5; i += 1) await Promise.resolve()
  expect(store.saved['plan/checks'].checked.length).toBe(1)
  // Removing items stays admin-only.
  expect([...root.querySelectorAll('.item .rm')].every((b) => b.disabled)).toBe(true)

  if (typeof stop === 'function') stop()
  jest.useRealTimers()
})
