import React from 'react'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

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
            <p className="text-sm text-gray-600 text-center leading-relaxed">
              {toppings.map((topping, index) => (
                <span key={index} className="capitalize">
                  {topping}
                  {index < toppings.length - 1 && (
                    <span className="text-amber-600 mx-1.5" aria-hidden="true">
                      &bull;
                    </span>
                  )}
                </span>
              ))}
            </p>
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
