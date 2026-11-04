import { mountPlanner } from './planner'

// A fake store: the planner reads ref/plan/checks and never touches Firestore here.
const fakeStore = (docs) => ({
  doc: (path) => ({
    set: () => Promise.resolve(),
    onSnapshot: (next) => {
      next({ exists: !!docs[path], data: () => docs[path], metadata: { hasPendingWrites: false, fromCache: false } })
      return () => {}
    },
  }),
})

// One 178 g ball's worth of recipe, so per-ball amounts equal these numbers.
const REF = {
  recipe: [
    { item: 'pizza dough weight (grams)', amount: 178 },
    { item: 'total weight', amount: 178 },
    { item: 'flour', amount: 100 },
    { item: 'cold water', amount: 50 },
    { item: 'warm water', amount: 10 },
    { item: 'salt', amount: 3 },
    { item: 'yeast', amount: 1 },
    { item: 'poolish', amount: 14 },
  ],
  menu: [],
  amounts: [],
  sauces: [],
  toppings: [],
  settings: [],
  nights: [],
}

const mount = (services) => {
  const root = document.createElement('div')
  document.body.append(root)
  const plan = { services, picked: [], counts: {}, tweaks: { buffer: 0, lead: 1, yeast: 100, water: 100 } }
  mountPlanner(root, { store: fakeStore({ 'ref/snapshot': REF, 'plan/current': plan, 'plan/checks': { items: [] } }), canWrite: true })
  return root
}

test('bread loaves share the pizza dough plan by weight', () => {
  const root = mount([
    { id: 'a', date: '2030-06-07', type: 'pf', balls: 100 },
    { id: 'b', date: '2030-06-07', type: 'bread', loaves: 4 },
  ])
  const plan = root.querySelector('#plan').textContent
  expect(plan).toContain('100 balls + 4 loaves')
  expect(plan).toContain('4 × 575 g')
  // 4 × 575 g = 2300 g = 12.92 balls; 100 + 12.92 balls of flour at 100 g each (+ half the poolish).
  const shop = root.querySelector('#shop-line').textContent
  expect(shop).toContain('100 dough balls · 4 loaves')
})

test('bread on its own needs no pizzas and uses its own loaf weight', () => {
  const root = mount([{ id: 'b', date: '2030-06-07', type: 'bread', loaves: 2, loafG: 600 }])
  expect(root.querySelector('#plan').textContent).toContain('2 loaves')
  expect(root.querySelector('#plan').textContent).toContain('2 × 600 g')
  expect(root.querySelector('.sugg').textContent).toContain('1.20 kg')
})

test('dough recipes start closed and stay open through a redraw', () => {
  const root = mount([{ id: 'a', date: '2030-06-07', type: 'pf', balls: 100 }])
  const cards = () => [...root.querySelectorAll('#plan details.stepcard')]
  expect(cards().map((c) => c.open)).toEqual([false, false])
  // What to do and when still shows while closed.
  expect(cards()[0].querySelector('summary').textContent).toContain('Start poolish')

  cards()[1].open = true
  cards()[1].dispatchEvent(new Event('toggle'))
  root.querySelector('#add-svc').click() // adding a service redraws the plan
  expect(cards().map((c) => c.open)).toEqual([false, true])

  cards()[1].open = false
  cards()[1].dispatchEvent(new Event('toggle'))
  expect(JSON.parse(localStorage.getItem('bybo-open-recipes'))).toEqual([])
})
