import React from 'react'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

// Renders toppings centered and wrapping across rows using flex `gap` for
// spacing. There are no inline bullet separators, so no separator can ever
// dangle at the left or right edge of a wrapped row, and because nothing is
// conditionally shown/hidden there is no measuring and no reflow jitter. This
// is fully responsive to any viewport.
const ToppingsList = ({ toppings }) => (
  <div className="text-sm text-gray-600 leading-relaxed flex flex-wrap justify-center items-center gap-x-3 gap-y-1">
    {toppings.map((topping, index) => (
      <span key={index} className="capitalize whitespace-nowrap">
        {topping}
      </span>
    ))}
  </div>
)

const PizzaDisplay = ({ pizza, modalOpen }) => {
  const toppings = (pizza.toppings || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  return (
    <div
      key={pizza.name}
      className="bg-white rounded-xl shadow-md overflow-hidden h-full flex flex-col"
    >
      {pizza.img && !modalOpen ? (
        <Zoom>
          <img
            onError={(e) => (e.target.src = 'https://placehold.co/600x400')}
            className="h-64 w-full object-cover"
            src={pizza.img}
            alt={pizza.name}
            loading="lazy"
            decoding="async"
          />
        </Zoom>
      ) : (
        <div className="h-64 w-full flex items-center bg-gray-100">
          <span className="text-center w-full text-gray-500">
            Picture Coming Soon!
          </span>
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <h2 className="capitalize font-bold text-center text-lg text-gray-900 min-h-[2rem] flex items-center justify-center">
          {pizza.name}
        </h2>
        <div className="mt-2 flex flex-col justify-center flex-1">
          {toppings.length > 0 ? (
            <ToppingsList toppings={toppings} />
          ) : (
            <p className="text-sm text-gray-400 text-center italic">
              Toppings coming soon
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default PizzaDisplay
