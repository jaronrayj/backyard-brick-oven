import { objectFilter } from '.'
import { rtdbGet } from './publicData'

// The website's active pizzas and toppings, read once over HTTPS (public).
const fetchActive = async (path) => objectFilter((await rtdbGet(path)) || {}, (item) => item.active)

const fetchActivePizzas = () => fetchActive('pizzas').catch((error) => console.log(error))
const fetchActiveToppings = () => fetchActive('toppings').catch((error) => console.log(error))

export { fetchActivePizzas, fetchActiveToppings }
