import { mountPlanner } from './planner'

const fakeStore = (docs) => ({
  doc: (path) => ({
    set: () => Promise.resolve(),
    onSnapshot: (next) => {
      const data = docs[path]
      next({ exists: !!data, data: () => data, metadata: { hasPendingWrites: false, fromCache: false } })
      return () => {}
    },
  }),
})
const REF = { settings: [], recipe: [], menu: [], nights: [], amounts: [], sauces: [], sections: [], at: 1 }
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

beforeEach(() => localStorage.clear())

test('the wrap-up count waits a few seconds, showing the last count meanwhile', async () => {
  jest.useFakeTimers()
  localStorage.setItem('bybo-wrapup-count', '2')
  const due = jest.fn(() => Promise.resolve({ items: [{}, {}, {}] }))
  const root = document.createElement('div')
  const stop = mountPlanner(root, { store: fakeStore({ 'ref/snapshot': REF, 'plan/current': { services: [] } }), canWrite: true, pizzas: () => () => {}, wrapUps: { due } })
  expect(root.querySelector('#tab-wrapup').textContent).toBe('Wrap up (2)')
  expect(due).not.toHaveBeenCalled()
  jest.advanceTimersByTime(4100)
  for (let i = 0; i < 5; i += 1) await Promise.resolve()
  expect(due).toHaveBeenCalledTimes(1)
  expect(root.querySelector('#tab-wrapup').textContent).toBe('Wrap up (3)')
  expect(localStorage.getItem('bybo-wrapup-count')).toBe('3')
  stop()
  jest.useRealTimers()
})

test("the calendar shows today's saved copy at once, then refreshes once", async () => {
  jest.useFakeTimers()
  localStorage.setItem('bybo-cal-2w', JSON.stringify({ day: today(), data: { items: [{ id: 'c1', title: 'Saved Friday', date: today(), notes: '' }] } }))
  let answer
  const calendar = jest.fn(() => new Promise((r) => { answer = r }))
  const root = document.createElement('div')
  const stop = mountPlanner(root, { store: fakeStore({ 'ref/snapshot': REF, 'plan/current': { services: [] } }), canWrite: true, pizzas: () => () => {}, calendar })
  expect(root.querySelector('#cal-suggest').textContent).toMatch(/Saved Friday/)
  expect(calendar).toHaveBeenCalledTimes(1) // just the two weeks; the month waits for the Calendar tab
  answer({ items: [{ id: 'c2', title: 'Fresh Friday', date: today(), notes: '' }] })
  for (let i = 0; i < 5; i += 1) await Promise.resolve()
  expect(root.querySelector('#cal-suggest').textContent).toMatch(/Fresh Friday/)
  expect(JSON.parse(localStorage.getItem('bybo-cal-2w')).data.items[0].title).toBe('Fresh Friday')
  stop()
  jest.useRealTimers()
})

test('opening a tab tells the page (so the wrap-up form loads only when opened)', () => {
  const root = document.createElement('div')
  const opened = []
  root.addEventListener('planner-tab', (e) => opened.push(e.detail))
  const stop = mountPlanner(root, { store: fakeStore({ 'ref/snapshot': REF, 'plan/current': { services: [] } }), canWrite: true, pizzas: () => () => {} })
  expect(opened).toEqual([])
  root.querySelector('.tabs [data-tab="prep"]').click()
  expect(opened).toEqual(['prep'])
  stop()
})
