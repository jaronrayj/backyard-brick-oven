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

  const socialMediaLinks = useMemo(() => {
    return [
      {
        href: 'https://www.instagram.com/backyard_brick_oven/',
        imgSrc: instagramLogo,
        altText: 'Backyard Brick Oven IG',
      },
      {
        href: 'https://www.facebook.com/people/Backyard-Brick-Oven-LLC/100090391791253/',
        imgSrc: facebookLogo,
        altText: 'Backyard Brick Oven FB',
      },
      {
        href: 'https://account.venmo.com/Jaron-Johnson-4?txn=pay&note=Backyard+Brick+Oven',
        imgSrc: venmoLogo,
        altText: 'Jaron Venmo',
      },
    ]
  }, [])

  const googleLinks = useMemo(() => {
    return [
      {
        href: 'https://g.co/kgs/8o94du5',
        imgSrc: googleLogo,
        altText: 'Google Calendar',
        text: 'Directions',
      },
      {
        href: 'https://calendar.google.com/calendar/u/0?cid=NDcyZDQ1ZjgwNGRhOTFiMTljYzBmNWE1OWUxNDQ1MjA1NzBhYjE5OTQzZGRjOTBlMDJjMmY0M2NhYTg3MDQ2MkBncm91cC5jYWxlbmRhci5nb29nbGUuY29t',
        imgSrc: googleCalendarLogo,
        altText: 'Google Calendar',
        text: 'Pizza Friday Calendar',
      },
    ]
  }, [])

  return (
    <>
      <div className="bg-slate-200 lg:w-3/4 m-auto">
        <div className="p-4">
          <div className="md:flex">
            <div className="md:w-1/2 self-center">
              <img src={pizzaFam} alt="pizza fam" className='rounded-xl' />
            </div>
            <div className="md:w-1/2 md:ml-4 rounded-md p-8 text-lg m-auto">
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
                around 1000°F for about 60 seconds
              </p>
              <p className="m-4">
                We accept cash or Venmo
              </p>

              <div className="flex justify-center gap-4">
                {socialMediaLinks.map(({ href, imgSrc, altText }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white rounded-full p-1 shadow-md hover:shadow-lg transition-shadow duration-200 w-16 h-16 flex"
                  >
                    <img className="w-14 h-14" src={imgSrc} alt={altText} />
                  </a>
                ))}
              </div>
              <div className="flex flex-col xl:flex-row justify-center items-center gap-4 mt-4">
                {googleLinks.map(({ href, imgSrc, altText, text }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-md hover:shadow-lg transition-shadow duration-200 w-auto h-12 min-w-[200px]"
                  >
                    <img className="w-10 h-10" src={imgSrc} alt={altText} />
                    <p className="text-sm font-bold whitespace-normal">
                      {text}
                    </p>
                  </a>
                ))}
              </div>
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
        <p className="mx-3">
          Wanna see us at your place? We travel!
          <br />
          {/* Check our catering page for more info. */}
          <a
            className="pointer text-blue-900"
            href="mailto:jj.backyardbrickoven@gmail.com"
          >
            jj.backyardbrickoven@gmail.com
          </a>{' '}
          for inquiries.
        </p>
      </div>
    </>
  )
}

export default MainPage
