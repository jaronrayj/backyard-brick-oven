import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import pizzaFam from '../../assets/main_cover.jpg'
import venmoLogo from '../../assets/venmo.png'
import facebookLogo from '../../assets/facebook.png'
import instagramLogo from '../../assets/instagram.png'
import googleLogo from '../../assets/google_logo.png'
import googleCalendarLogo from '../../assets/google-calendar-logo.png'
import {
  fetchActivePizzas,
} from '../../utils/rtdb_queries'
import PizzaDisplay from '../../components/PizzaDisplay'
import ImageCarousel from '../../components/ImageCarousel'
import actionTeamOvens from '../../assets/action_team_ovens.jpg'
import actionGuestLine from '../../assets/action_guest_line.jpg'
import actionCookingGuests from '../../assets/action_cooking_guests.jpg'
import actionPavilionCrowd from '../../assets/action_pavilion_crowd.jpg'
import actionCrew from '../../assets/action_crew.jpg'
import actionOvenMountains from '../../assets/action_oven_mountains.jpg'
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
      <Helmet>
        <title>Backyard Brick Oven | Neapolitan-Style Pizza in Bountiful, Utah</title>
        <meta
          name="description"
          content="Backyard Brick Oven — Neapolitan-style brick oven pizza in Bountiful, Utah by Jaron Johnson. Join us for Pizza Friday or book catering for your next event."
        />
        <link rel="canonical" href="https://backyard-brickoven.web.app/" />
      </Helmet>
      <div className="bg-slate-200 lg:w-3/4 m-auto">
        <div className="p-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="self-center">
              <img
                src={pizzaFam}
                alt="Backyard Brick Oven owners at their mobile pizza topping station with a fired-up brick oven"
                className="rounded-xl w-full max-h-[28rem] object-cover"
              />
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 text-lg flex flex-col justify-center">
              <div className="text-center leading-relaxed">
                <p className="mt-2 text-xl">
                  Come enjoy <span className="font-bold">Pizza Friday</span>{' '}
                  with us!
                </p>
                <p className="mt-2">
                  <span className="font-bold">5pm-7:30pm</span> &middot;{' '}
                  <span className="font-bold">$12 a pie</span>
                </p>
              </div>
              <p className="mt-4">
                🔥 Each 10" thin crust pizza is flame cooked in our Gozney dome
                at 1000°F — ready in about 60 seconds flat
              </p>

              <br />
              <div className="flex justify-center gap-4">
                {socialMediaLinks.map(({ href, imgSrc, altText }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white ring-1 ring-gray-300 rounded-full p-1 shadow-md cursor-pointer w-16 h-16 flex active:scale-95 active:shadow-sm hover:shadow-lg hover:ring-yellow-400 transition-all duration-150"
                  >
                    <img
                      className="w-14 h-14 object-contain"
                      src={imgSrc}
                      alt={altText}
                    />
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
                    className="flex items-center space-x-2 bg-white ring-1 ring-gray-300 rounded-full px-4 py-2 shadow-md cursor-pointer w-auto h-12 min-w-[200px] active:scale-95 active:shadow-sm hover:shadow-lg hover:ring-yellow-400 transition-all duration-150"
                  >
                    <img
                      className="w-10 h-10 object-contain shrink-0"
                      src={imgSrc}
                      alt={altText}
                    />
                    <p className="text-sm font-bold whitespace-normal">
                      {text}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </div>
          {Object.keys(specialPizzas).length !== 0 && (
            <div className="mb-14">
              <h2 className="font-bold text-xl mb-4 mt-6">
                Special of the Week!
              </h2>
              {Object.entries(activePizzas).map(
                ([key, value]) =>
                  value.special && (
                    <PizzaDisplay
                      key={key}
                      pizza={value}
                      modalOpen={isModalOpen}
                    />
                  ),
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
                  ),
              )}
          </div>

          {/* See Us in Action */}
          <div className="mt-10">
            <h2 className="font-bold text-xl mb-1 text-center">
              See Us in Action
            </h2>
            <p className="text-gray-600 text-center mb-4">
              From backyard parties to big events across Utah.
            </p>
            <ImageCarousel
              images={[
                {
                  src: actionPavilionCrowd,
                  alt: 'A packed pavilion event with guests seated at tables while the crew cooks pizzas',
                },
                {
                  src: actionGuestLine,
                  alt: 'Guests lined up at the dough station during a neighborhood pizza event',
                },
                {
                  src: actionTeamOvens,
                  alt: 'The Backyard Brick Oven team cooking on multiple ovens at a large outdoor event',
                },
                {
                  src: actionCookingGuests,
                  alt: 'Cooking fresh pizzas for guests with a Utah mountain backdrop',
                },
                {
                  src: actionOvenMountains,
                  alt: 'Firing up the brick oven at an outdoor event with mountains behind',
                },
                {
                  src: actionCrew,
                  alt: 'The Backyard Brick Oven team ready to serve at an event',
                },
              ]}
            />
          </div>
        </div>
        <div className="mx-3 mb-6">
          <a
            href="/inquiries"
            className="block bg-amber-600 hover:bg-amber-700 text-white font-bold text-center py-6 px-8 rounded-lg shadow-md transition-colors duration-200"
          >
            <div className="text-2xl mb-2">
              Wanna see us at your place? We travel!
            </div>
            <div className="text-lg">Click here for catering inquiries →</div>
          </a>
        </div>
      </div>
    </>
  )
}

export default MainPage
