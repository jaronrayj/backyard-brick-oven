import { mountPlanner } from './planner'

// The Pizzas card: older pizzas (off the website) stay folded, except the ones
// this service already uses, which show in the open.
const fakeStore = (docs) => ({
  doc: (path) => ({
    set: () => Promise.resolve(),
    onSnapshot: (next) => {
      next({ exists: !!docs[path], data: () => docs[path], metadata: { hasPendingWrites: false, fromCache: false } })
      return () => {}
    },
  }),
})

const REF = {
  recipe: [
    { item: 'pizza dough weight (grams)', amount: 178 },
    { item: 'total weight', amount: 178 },
    { item: 'flour', amount: 100 },
  ],
  menu: [
    { name: 'Margherita', toppings: 'mozzarella', active: true },
    { name: 'Pepperoni', toppings: 'mozzarella', active: true },
    { name: 'Old Hawaiian', toppings: 'mozzarella', active: false },
    { name: 'Old BBQ', toppings: 'mozzarella', active: false },
    { name: 'Old Pesto', toppings: 'mozzarella', active: false },
  ],
  amounts: [],
  sauces: [],
  toppings: [],
  settings: [],
  nights: [],
}

const mount = (picked) => {
  const root = document.createElement('div')
  document.body.append(root)
  const plan = {
    services: [{ id: 'a', date: '2030-06-07', type: 'pf', balls: 60, picked, counts: {} }],
    tweaks: { buffer: 0, lead: 1, yeast: 100, water: 100 },
  }
  mountPlanner(root, { store: fakeStore({ 'ref/snapshot': REF, 'plan/current': plan, 'plan/checks': { items: [] } }), canWrite: true })
  return root
}
const older = (root) => root.querySelector('#chips details.pick-group')
const chipNames = (el) => [...el.querySelectorAll('.chip')].map((b) => b.textContent)

test('older pizzas start folded when none are picked', () => {
  const root = mount(['Margherita'])
  expect(older(root).open).toBe(false)
  expect(older(root).querySelector('summary').textContent).toContain('(3)')
  expect(root.querySelector('#chips .older-picked')).toBeNull()
})

test('picked older pizzas show in the open; the rest stay folded', () => {
  const root = mount(['Margherita', 'Old BBQ'])
  const shown = root.querySelector('#chips .older-picked')
  expect(chipNames(shown)).toEqual(['Old BBQ'])
  expect(older(root).open).toBe(false)
  expect(chipNames(older(root))).toEqual(['Old Hawaiian', 'Old Pesto'])
  expect(older(root).querySelector('summary').textContent).toContain('(2)')
})

test('the fold stays open while picking from it', () => {
  const root = mount(['Margherita'])
  older(root).open = true
  older(root).dispatchEvent(new Event('toggle'))
  // Picking redraws the chips; the fold shouldn't snap shut.
  older(root).querySelector('.chip').click()
  expect(older(root).open).toBe(true)
  expect(chipNames(root.querySelector('#chips .older-picked'))).toEqual(['Old Hawaiian'])
})
