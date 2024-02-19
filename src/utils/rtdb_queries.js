import { rtdb } from './firebase'
import { ref, onValue } from 'firebase/database'

// Initialize Realtime Database and get a reference to the service

const pizzaDb = ref(rtdb, 'pizzas/')

Object.filter = (obj, predicate) =>
  Object.keys(obj)
    .filter((key) => predicate(obj[key]))
    // eslint-disable-next-line no-sequences
    .reduce((res, key) => ((res[key] = obj[key]), res), {})

const fetchActivePizzas = async () => {
  try {
    return new Promise((resolve, reject) => {
      onValue(
        pizzaDb,
        (pizzas) => {
          resolve(Object.filter(pizzas.val(), (pizza) => pizza.active))
        },
        (error) => {
          reject(error)
        }
      )
    })
  } catch (error) {
    console.log(error)
  }
}

export { fetchActivePizzas }
