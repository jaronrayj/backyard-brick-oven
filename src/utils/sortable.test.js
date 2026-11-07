import { sortable, moved } from './sortable'

test('moved puts one entry at a new index', () => {
  expect(moved(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
  expect(moved(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c'])
})

test('arrow keys on a handle move its row', () => {
  const ul = document.createElement('ul')
  ul.innerHTML = ['a', 'b', 'c'].map((x) => `<li><button class="grip" data-sort-id="${x}">⠿</button>${x}</li>`).join('')
  document.body.append(ul)
  const calls = []
  const stop = sortable(ul, { items: () => [...ul.children], handle: '.grip', onMove: (f, t) => calls.push([f, t]) })
  const key = (i, k) => ul.querySelectorAll('.grip')[i].dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
  key(1, 'ArrowUp')
  key(0, 'ArrowUp') // already first: nothing
  key(2, 'ArrowDown') // already last: nothing
  key(0, 'ArrowDown')
  expect(calls).toEqual([[1, 0], [0, 1]])
  stop()
})

test('dragging a handle down past two rows moves it there', () => {
  const ul = document.createElement('ul')
  ul.innerHTML = ['a', 'b', 'c', 'd'].map((x) => `<li data-x="${x}"><button class="grip">⠿</button>${x}</li>`).join('')
  document.body.append(ul)
  // Fake layout: each row is 40px tall, in DOM order.
  ;[...ul.children].forEach((li) => {
    li.getBoundingClientRect = () => {
      const i = [...ul.children].indexOf(li)
      return { top: i * 40, height: 40, bottom: i * 40 + 40 }
    }
  })
  const calls = []
  sortable(ul, { items: () => [...ul.children], handle: '.grip', onMove: (f, t) => calls.push([f, t]) })
  const grip = ul.querySelector('[data-x="a"] .grip')
  const fire = (type, y) => {
    const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientY: y, button: 0 })
    e.pointerId = 1
    grip.dispatchEvent(e)
  }
  fire('pointerdown', 20)
  fire('pointermove', 70) // past b's middle (60)
  fire('pointermove', 110) // past c's middle (100)
  expect([...ul.children].map((li) => li.dataset.x)).toEqual(['b', 'c', 'a', 'd']) // shows where it lands
  fire('pointerup', 110)
  expect(calls).toEqual([[0, 2]])
  expect([...ul.children].map((li) => li.dataset.x)).toEqual(['a', 'b', 'c', 'd']) // the redraw sets the real order
})
