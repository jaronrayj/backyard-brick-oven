import { objectFilter } from '.'
import { rtdb } from './firebase'
import { ref, onValue } from 'firebase/database'

// Initialize Realtime Database and get a reference to the service

const pizzaDb = ref(rtdb, 'pizzas/')
const toppingDb = ref(rtdb, 'toppings/')

const fetchActivePizzas = async () => {
  try {
    return new Promise((resolve, reject) => {
      onValue(
        pizzaDb,
        (pizzas) => {
          resolve(objectFilter(pizzas.val(), (pizza) => pizza.active))
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

const fetchActiveToppings = async () => {
  try {
    return new Promise((resolve, reject) => {
      onValue(
        toppingDb,
        (pizzas) => {
          resolve(objectFilter(pizzas.val(), (pizza) => pizza.active))
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

export { fetchActivePizzas, fetchActiveToppings }
