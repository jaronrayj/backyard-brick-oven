import React from 'react'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

const PizzaDisplay = ({ pizza, modalOpen }) => {
  const toppings = pizza.toppings.split(',')

  return (
    <div key={pizza.name}>
      {pizza.img && !modalOpen ? (
        <Zoom>
          <img
            onError={(e) => (e.target.src = 'https://placehold.co/600x400')}
            className="h-64 flex object-cover rounded-md shadow-md mx-auto"
            src={pizza.img}
            alt={pizza.name}
          />
        </Zoom>
      ) : (
        <div className="h-64 w-auto max-w-sm flex items-center m-auto bg-gray-200">
          <span className="text-center w-full">Picture Coming Soon!</span>
        </div>
      )}
      <div className="mt-1 max-w-sm m-auto">
        <h2 className="capitalize font-bold text-center text-lg h-12 sm:h-4 flex items-center justify-center mt-2">{pizza.name}</h2>
        <div className="p-1 h-30 sm:h-20 flex flex-col justify-center">
          <p className="text-sm">
            {toppings.map((topping, index) => {
              return (
                <span className="capitalize" key={index}>
                  {topping.trim()}
                  {index === toppings.length - 1 ? '' : ', '}
                </span>
              )
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PizzaDisplay
