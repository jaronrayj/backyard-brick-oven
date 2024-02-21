import React, { useState, useEffect, useMemo, useCallback } from 'react'
import pizzaFam from '../../assets/pizza_fam.JPG'
import venmoLogo from '../../assets/venmo.png'
import facebookLogo from '../../assets/facebook.png'
import instagramLogo from '../../assets/instagram.png'
// import Map from '../../components/Map'
import { fetchActivePizzas } from '../../utils/rtdb_queries'
import Carousel from '../../components/Carousel'
import PizzaDisplay from '../../components/PizzaDisplay'

const MainPage = () => {
  const [activePizzas, setActivePizzas] = useState({})

  const activeToppings = [
    'Marinara',
    'Creamy pesto',
    'Mozzarella',
    'Balsamic Roasted Tomatoes',
    'Caramelized Onions',
    'Sriracha Chicken',
    'Bacon',
    'Italian Sausage',
    'Pepperoni',
    'Fresh Pineapple',
    'Bell Peppers',
    'Jalapenos',
  ]

  const fetchingActivePizzas = useCallback(async () => {
    fetchActivePizzas()
      .then((dbActivePizzas) => {
        setActivePizzas(dbActivePizzas)
      })
      .catch((err) => console.log('error fetching from firebase:', err))
  }, [])

  useEffect(() => {
    console.log('fetching data from firebase...')
    fetchingActivePizzas()
  }, [fetchingActivePizzas])

  return (
    <>
      <div className="bg-white mt-8 md:w-2/3 m-auto">
        <div className="p-8">
          <div className="md:flex">
            <div className="md:w-1/2 align-middle">
              <img src={pizzaFam} alt="cooking pizza" />
            </div>
            <div className="md:w-1/2 md:ml-4 bg-slate-200 rounded-md p-8 text-lg m-auto">
              {/* todo update this paragraph */}
              <p className="mt-8">
                Come enjoy <span className="font-bold">Pizza Friday</span> in
                our backyard from <span className="font-bold">5pm-7pm</span>!
                Choose from our selection of homemade sauces and toppings that
                tickle your fancy and we'll make it for you on the spot for $8
                each.
              </p>
              <p className="mt-8">
                We have two propane powered Gozney Domes© that maintain around
                850°F and can cook a pie in about 70 seconds. Each pizza is
                about 9-10 inches. We accept Venmo or cash.
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
                  <img className="w-14" src={instagramLogo} alt="Jaron Venmo" />
                </a>
                <a
                  href="https://www.facebook.com/people/Backyard-Brick-Oven-LLC/100090391791253/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img className="w-14" src={facebookLogo} alt="Jaron Venmo" />
                </a>
                <a
                  href="https://account.venmo.com/u/Jaron-Johnson-4"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img className="w-14" src={venmoLogo} alt="Jaron Venmo" />
                </a>
              </div>
              <div className="flex justify-center mt-4">
                <div className="mt-auto mb-auto">
                  We take a few Fridays off, follow our social media to stay in
                  touch!
                </div>
              </div>
              <br />
            </div>
          </div>
          <div className="font-bold text-xl mb-6 mt-6"> Current Pizzas</div>
          <div className="grid grid-cols-2 gap-4">
            {activePizzas &&
              Object.entries(activePizzas).map(
                ([key, value]) =>
                  !value.special && <PizzaDisplay key={key} pizza={value} />
              )}
          </div>
        </div>
        <script
          src="https://cdn.jsdelivr.net/npm/publicalbum@latest/embed-ui.min.js"
          async
        ></script>
        {/* <Carousel /> */}
        {/* <Map zoomLevel={19} /> */}
        <br />
        {/* <p className="mx-3">
          We are open to catering! Hit us up on our social media or email us at{' '}
          <a
            className="pointer text-blue-900"
            href="jj.backyardbrickoven@gmail.com"
          >
            jj.backyardbrickoven@gmail.com
          </a>{' '}
          for any inquiries.
        </p>
        <br /> */}
      </div>
    </>
  )
}

export default MainPage
