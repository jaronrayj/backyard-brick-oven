import React from 'react'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

const PizzaDisplay = ({ pizza }) => {
  const toppings = pizza.toppings.split(',')

  return (
    <div className="mb-6" key={pizza.name}>
      {pizza.img ? (
        <Zoom>
          <img
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
      <div className="rounded-md bg-slate-200 mt-1 max-w-sm m-auto p-1">
        <h1 className="capitalize font-bold">{pizza.name}</h1>

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
  )
}

export default PizzaDisplay
