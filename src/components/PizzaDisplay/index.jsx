import React from 'react'

const PizzaDisplay = ({ pizza }) => {
  const toppings = pizza.toppings.split(',')

  return (
    <div className="mb-6" key={pizza.name}>
      {pizza.img ? (
        <img
          className="h-64 flex object-cover rounded-md shadow-md mx-auto"
          src={pizza.img}
          alt={pizza.name}
        />
      ) : (
        <div className="h-64 w-auto flex items-center text-center bg-gray-200">
          <span className="text-center w-full">Picture Coming Soon!</span>
        </div>
      )}
      <div className="rounded-md bg-gray-300">
        <h1 className="capitalize font-bold">{pizza.name}</h1>

        <p className="text-sm">
          {toppings.map((topping, index) => {
            if (index === toppings.length - 1) {
              return (
                <span className="capitalize" key={index}>
                  {topping.trim()}
                </span>
              )
            } else {
              return (
                <span className="capitalize" key={index}>
                  {topping.trim()},{' '}
                </span>
              )
            }
          })}
        </p>
      </div>
    </div>
  )
}

export default PizzaDisplay
