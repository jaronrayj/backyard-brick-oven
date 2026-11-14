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
const settle = async () => {
  jest.advanceTimersByTime(1000)
  for (let i = 0; i < 5; i += 1) await Promise.resolve()
}

test('Bring: the add form sits at the top, always showing, like Shopping and Prep', async () => {
  jest.useFakeTimers()
  const store = fakeStore({ 'ref/snapshot': REF, 'plan/current': { services: [], bring: [{ id: 'a', name: 'Gloves', for: 'all' }] } })
  const root = document.createElement('div')
  document.body.appendChild(root)
  const stop = mountPlanner(root, { store, canWrite: true, pizzas: () => () => {} })
  await settle()

  const form = root.querySelector('#bring-form')
  expect(form.tagName).toBe('FORM')
  expect(form.hidden).toBe(false)
  // Before the lists, with Edit list next to Uncheck everything.
  const list = root.querySelector('#bringlist')
  expect(form.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(root.querySelector('#bring-edit').parentElement).toBe(root.querySelector('#bring-uncheck').parentElement)
  // Edit list doesn't hide or show the form any more.
  root.querySelector('#bring-edit').click()
  expect(form.hidden).toBe(false)
  root.querySelector('#bring-edit').click()

  // Adding works by submitting (Add button or Enter).
  root.querySelector('#bring-new').value = 'Pizza peels'
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await settle()
  expect(store.saved['plan/current'].bring.map((b) => b.name)).toEqual(['Gloves', 'Pizza peels'])
  expect(root.querySelector('#bring-new').value).toBe('')

  if (typeof stop === 'function') stop()
  jest.useRealTimers()
})

test('Bring for crew: add form and Edit list are disabled', async () => {
  jest.useFakeTimers()
  const store = fakeStore({ 'ref/snapshot': REF, 'plan/current': { services: [], bring: [] } })
  const root = document.createElement('div')
  const stop = mountPlanner(root, { store, canWrite: false, canCheck: true, shopping: false, pizzas: () => () => {} })
  await settle()
  expect(root.querySelector('#bring-new').disabled).toBe(true)
  expect(root.querySelector('#bring-add').disabled).toBe(true)
  expect(root.querySelector('#bring-edit').disabled).toBe(true)
  if (typeof stop === 'function') stop()
  jest.useRealTimers()
})
