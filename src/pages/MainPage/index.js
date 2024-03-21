import React, { useState, useEffect, useMemo, useCallback } from 'react'
import pizzaFam from '../../assets/pizza_fam_short.JPG'
import venmoLogo from '../../assets/venmo.png'
import facebookLogo from '../../assets/facebook.png'
import instagramLogo from '../../assets/instagram.png'
// import Map from '../../components/Map'
import {
  fetchActivePizzas,
  fetchActiveToppings,
} from '../../utils/rtdb_queries'
import Carousel from '../../components/Carousel'
import PizzaDisplay from '../../components/PizzaDisplay'
import Modal from '../../components/Modal'
import { objectFilter } from '../../utils'

const MainPage = () => {
  const [activePizzas, setActivePizzas] = useState({})
  const [activeToppings, setActiveToppings] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [specialPizzas, setSpecialPizzas] = useState({})

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  const fetchingActiveDb = useCallback(async (fetchDb, stateToSet) => {
    fetchDb()
      .then((db) => {
        stateToSet(db)
      })
      .catch((err) => console.log('error fetching from firebase:', err))
  }, [])

  useEffect(() => {
    console.log('fetching data from firebase...')
    fetchingActiveDb(fetchActivePizzas, setActivePizzas)
    fetchingActiveDb(fetchActiveToppings, setActiveToppings)
  }, [fetchingActiveDb])
  useEffect(() => {
    const specials = objectFilter(activePizzas, (pizza) => pizza.special)
    setSpecialPizzas(specials)
  }, [activePizzas])

  return (
    <>
      <div className="bg-white lg:w-3/4 m-auto">
        <div className="p-4">
          <div className="md:flex">
            <div className="md:w-1/2 self-center">
              <img src={pizzaFam} alt="pizza fam" />
            </div>
            <div className="md:w-1/2 md:ml-4 bg-slate-200 rounded-md p-8 text-lg m-auto">
              <p className="mt-2">
                Come enjoy <span className="font-bold">Pizza Friday</span> with
                us in our backyard! We are open from{' '}
                <span className="font-bold">5pm-7pm</span>. Pick from some of
                our favorites below or mix and match to your liking. Each pizza
                costs <span className="font-bold">$8</span>.
              </p>
              <p className="mt-4">
                Each thin crust pie is cooked on the spot in about 70 seconds
                and measures about 9-10 inches. We accept Venmo or cash.
              </p>

              <div className="flex justify-center mt-4">
                <div className="mt-auto mb-auto">
                  <a
                    href="https://goo.gl/maps/sQ3ZoUpVgMqc2aZg8"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="pointer-events-auto text-xl decoration-red-600 underline font-bold">
                      Click here for directions to our backyard
                    </div>
                  </a>
                </div>
              </div>
              <div className="flex justify-center">
                <a
                  href="https://www.instagram.com/backyardbrickovenllc/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img className="w-14" src={instagramLogo} alt="Jaron IG" />
                </a>
                <a
                  href="https://www.facebook.com/people/Backyard-Brick-Oven-LLC/100090391791253/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img className="w-14" src={facebookLogo} alt="Jaron FB" />
                </a>
                <a
                  href="https://account.venmo.com/Jaron-Johnson-4?txn=pay&note=Backyard+Brick+Oven"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img className="w-14" src={venmoLogo} alt="Jaron Venmo" />
                </a>
              </div>
              <div className="flex justify-center mt-4">
                Follow us on social media for updates!
              </div>
              {activeToppings && (
                <>
                  <button
                    className="pointer-events-auto font-bold mt-2 bg-slate-400 p-2 rounded-md"
                    onClick={openModal}
                  >
                    Available Toppings
                  </button>
                  <Modal isOpen={isModalOpen} onClose={closeModal}>
                    <h2 className="font-bold">Toppings</h2>
                    <ul>
                      {Object.entries(activeToppings).map(([key, value]) => (
                        <li className="capitalize mt-3" key={key}>
                          {value.topping}
                        </li>
                      ))}
                    </ul>
                  </Modal>
                </>
              )}
            </div>
          </div>
          {Object.keys(specialPizzas).length !== 0 && (
            <>
              <h2 className="font-bold text-xl mb-6 mt-6">Weekly Special</h2>
              {Object.entries(activePizzas).map(
                ([key, value]) =>
                  value.special && (
                    <PizzaDisplay
                      key={key}
                      pizza={value}
                      modalOpen={isModalOpen}
                    />
                  )
              )}
            </>
          )}
          <div className="font-bold text-xl mb-6 mt-6">Current Pizzas</div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {activePizzas &&
              Object.entries(activePizzas).map(
                ([key, value]) =>
                  !value.special && (
                    <PizzaDisplay
                      key={key}
                      pizza={value}
                      modalOpen={isModalOpen}
                    />
                  )
              )}
          </div>
        </div>
        {/* <script
          src="https://cdn.jsdelivr.net/npm/publicalbum@latest/embed-ui.min.js"
          async
        ></script> */}
        {/* <Carousel /> */}
        {/* <p className="mx-3">
          We are open to catering! Hit us up on our social media or email us at{' '}
          <a
            className="pointer text-blue-900"
            href="jj.backyardbrickoven@gmail.com"
          >
            jj.backyardbrickoven@gmail.com
          </a>{' '}
          for any inquiries.
        </p> */}
      </div>
    </>
  )
}

export default MainPage
