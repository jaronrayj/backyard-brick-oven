const objectFilter = (obj, predicate) =>
  Object.keys(obj)
    .filter((key) => predicate(obj[key]))
    // eslint-disable-next-line no-sequences
    .reduce((res, key) => ((res[key] = obj[key]), res), {})

// Menu order: pizzas with an `order` number first, lowest first; the rest by name.
const sortPizzas = (pizzas) =>
  Object.entries(pizzas || {}).sort(([, a], [, b]) => {
    const ao = typeof a.order === 'number' ? a.order : Infinity
    const bo = typeof b.order === 'number' ? b.order : Infinity
    if (ao !== bo) return ao < bo ? -1 : 1
    return String(a.name || '').localeCompare(String(b.name || ''))
  })

export { objectFilter, sortPizzas }
