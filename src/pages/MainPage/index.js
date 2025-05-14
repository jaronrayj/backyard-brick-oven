import React, { useState, useEffect, useMemo, useCallback } from 'react'
import pizzaFam from '../../assets/bybo_team-min.jpg'
import venmoLogo from '../../assets/venmo.png'
import facebookLogo from '../../assets/facebook.png'
import instagramLogo from '../../assets/instagram.png'
import googleLogo from '../../assets/google_logo.png'
import googleCalendarLogo from '../../assets/google-calendar-logo.png'
import {
  fetchActivePizzas,
} from '../../utils/rtdb_queries'
import PizzaDisplay from '../../components/PizzaDisplay'
import { objectFilter } from '../../utils'

const MainPage = () => {
  const [activePizzas, setActivePizzas] = useState({})
  // const [activeToppings, setActiveToppings] = useState({})
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
    // fetchingActiveDb(fetchActiveToppings, setActiveToppings)
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
              <img src={pizzaFam} alt="pizza fam" className='rounded-xl' />
            </div>
            <div className="md:w-1/2 md:ml-4 bg-slate-200 rounded-md p-8 text-lg m-auto">
              <div className="text-center leading-relaxed">
                <p className="mt-2">
                  Come enjoy <span className="font-bold">Pizza Friday</span> with us in our backyard!
                </p>
                <p className="mt-2">
                  <span className="font-bold">5pm-7pm</span> Each pizza costs <span className="font-bold">$8</span>
                </p>
              </div>
              <p className="mt-4">
                Each thin crust pie is about 10 inches and is flame cooked in our Gozney dome 
                around 950°F for about 70 seconds
                <hr />
                We accept Venmo or cash
              </p>

              <div className="flex justify-center gap-4">
                <a
                  href="https://www.instagram.com/backyard_brick_oven/"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white rounded-full p-1 shadow-md hover:shadow-lg transition-shadow duration-200 w-16 h-16"
                >
                  <img className="w-14 h-14" src={instagramLogo} alt="Backyard Brick Oven IG" />
                </a>
                <a
                  href="https://www.facebook.com/people/Backyard-Brick-Oven-LLC/100090391791253/"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white rounded-full p-1 shadow-md hover:shadow-lg transition-shadow duration-200 w-16 h-16"
                >
                  <img className="w-14 h-14" src={facebookLogo} alt="Backyard Brick Oven FB" />
                </a>
                <a
                  href="https://account.venmo.com/Jaron-Johnson-4?txn=pay&note=Backyard+Brick+Oven"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white rounded-full p-1 shadow-md hover:shadow-lg transition-shadow duration-200 w-16 h-16 flex"
                >
                  <img className="w-12 h-12 m-auto" src={venmoLogo} alt="Jaron Venmo" />
                </a>
              </div>
              <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-4">
                <a
                  href="https://g.co/kgs/8o94du5"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-md hover:shadow-lg transition-shadow duration-200 w-auto h-12 min-w-[200px]"
                >
                  <img className="w-10 h-10" src={googleLogo} alt="Google Directions" />
                  <p className="text-sm font-bold whitespace-normal">
                    Directions
                  </p>
                </a>
                <a
                  href="https://calendar.google.com/calendar/u/0?cid=NDcyZDQ1ZjgwNGRhOTFiMTljYzBmNWE1OWUxNDQ1MjA1NzBhYjE5OTQzZGRjOTBlMDJjMmY0M2NhYTg3MDQ2MkBncm91cC5jYWxlbmRhci5nb29nbGUuY29t"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-md hover:shadow-lg transition-shadow duration-200 w-auto h-12 min-w-[200px]"
                >
                  <img className="h-10" src={googleCalendarLogo} alt="Google Calendar" />
                  <p className="text-sm font-bold">Pizza Friday Calendar</p>
                </a>
              </div>
              {/* {activeToppings && (
                <>
                  <button
                    className="pointer-events-auto font-bold mt-2 bg-slate-400 p-1 rounded-md"
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
              )} */}
            </div>
          </div>
          {Object.keys(specialPizzas).length !== 0 && (
            <div className='mb-14'>
              <h2 className="font-bold text-xl mb-4 mt-6">Special of the Week!</h2>
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
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
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
