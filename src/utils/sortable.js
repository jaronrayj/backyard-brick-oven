// Drag to reorder, by a grip handle, with a mouse or a finger. Plain DOM, so the
// Planner (plain JS) and React pages (Menu) share it.
//
//   const stop = sortable(container, {
//     items: () => [...elements in order],   // the rows that can move
//     handle: '.grip',                       // what you press to drag
//     onMove: (from, to) => { ... },         // save the new order (indexes into items())
//   })
//
// While dragging, the row moves through the list so you can see where it lands. On
// release it goes back where it was and onMove gets the change; the page redraws in
// the new order. The handle also takes ↑ / ↓ keys for keyboard use.

const EDGE = 70 // px from the top or bottom of the screen where the page scrolls by itself

export function sortable(container, { items, handle, onMove }) {
  let drag = null

  const listOf = () => items().filter(Boolean)

  const autoScroll = () => {
    if (!drag) return
    const y = drag.y
    const speed = y < EDGE ? -(EDGE - y) / 4 : y > window.innerHeight - EDGE ? (y - (window.innerHeight - EDGE)) / 4 : 0
    if (speed) {
      window.scrollBy(0, speed)
      place()
    }
    drag.raf = requestAnimationFrame(autoScroll)
  }

  // Put the dragged row before the first other row whose middle is below the pointer.
  const place = () => {
    const others = listOf().filter((x) => x !== drag.item)
    if (!others.length) return
    const below = others.find((x) => {
      const r = x.getBoundingClientRect()
      return drag.y < r.top + r.height / 2
    })
    if (below) {
      if (drag.item.nextElementSibling !== below) below.before(drag.item)
    } else {
      const last = others[others.length - 1]
      if (last.nextElementSibling !== drag.item) last.after(drag.item)
    }
  }

  const finish = (commit) => {
    if (!drag) return
    const { item, from, parent, next, raf } = drag
    cancelAnimationFrame(raf)
    const to = listOf().indexOf(item)
    item.classList.remove('dragging')
    document.body.classList.remove('sorting')
    parent.insertBefore(item, next) // back where it was; the redraw shows the new order
    drag = null
    if (commit && to >= 0 && to !== from) onMove(from, to)
  }

  const down = (e) => {
    const h = e.target.closest(handle)
    if (!h || !container.contains(h) || h.disabled || (e.button != null && e.button !== 0)) return
    const list = listOf()
    const item = list.find((x) => x.contains(h))
    if (!item) return
    e.preventDefault()
    try {
      h.setPointerCapture(e.pointerId)
    } catch (err) {
      /* older browsers: the move still works while over the page */
    }
    drag = { item, from: list.indexOf(item), parent: item.parentNode, next: item.nextSibling, y: e.clientY, raf: 0 }
    item.classList.add('dragging')
    document.body.classList.add('sorting')
    drag.raf = requestAnimationFrame(autoScroll)
  }
  const move = (e) => {
    if (!drag) return
    drag.y = e.clientY
    place()
  }
  const up = () => finish(true)
  const cancel = () => finish(false)

  // Keyboard: ↑ / ↓ on a focused handle moves the row one place, and focus follows it.
  const key = (e) => {
    const h = e.target.closest(handle)
    if (!h || h.disabled || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
    const list = listOf()
    const from = list.findIndex((x) => x.contains(h))
    const to = from + (e.key === 'ArrowUp' ? -1 : 1)
    if (from < 0 || to < 0 || to >= list.length) return
    e.preventDefault()
    const id = h.dataset.sortId
    onMove(from, to)
    if (id) {
      requestAnimationFrame(() => {
        const again = [...container.querySelectorAll(handle)].find((x) => x.dataset.sortId === id)
        if (again) again.focus()
      })
    }
  }
  // A handle inside a <label> shouldn't tick the checkbox.
  const click = (e) => {
    if (e.target.closest(handle)) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  container.addEventListener('pointerdown', down)
  container.addEventListener('pointermove', move)
  container.addEventListener('pointerup', up)
  container.addEventListener('pointercancel', cancel)
  container.addEventListener('keydown', key)
  container.addEventListener('click', click, true)
  return () => {
    finish(false)
    container.removeEventListener('pointerdown', down)
    container.removeEventListener('pointermove', move)
    container.removeEventListener('pointerup', up)
    container.removeEventListener('pointercancel', cancel)
    container.removeEventListener('keydown', key)
    container.removeEventListener('click', click, true)
  }
}

// Move one entry of a list from one index to another (a copy).
export const moved = (list, from, to) => {
  const out = list.slice()
  const [x] = out.splice(from, 1)
  out.splice(to, 0, x)
  return out
}
