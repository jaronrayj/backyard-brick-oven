import React from 'react'

const Inquiries = () => {
  return (
    <div className="bg-slate-200 lg:w-3/4 m-auto p-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">🍕 Bring the Pizza Party to You! 🍕</h1>
        <p className="text-xl text-gray-700">
          We bring our mobile brick oven to your location for an unforgettable experience
        </p>
      </div>

      {/* Event Types */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">Perfect For Any Occasion</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="font-bold">Birthday Parties</h3>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-2">💼</div>
            <h3 className="font-bold">Corporate Events</h3>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-2">👰</div>
            <h3 className="font-bold">Weddings</h3>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-2">🏡</div>
            <h3 className="font-bold">Neighborhood Gatherings</h3>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-2">🎓</div>
            <h3 className="font-bold">Graduations</h3>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-2">👨‍🍳</div>
            <h3 className="font-bold">Pizza Making Classes</h3>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-yellow-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
            <h3 className="font-bold mb-2">Contact Us</h3>
            <p className="text-gray-700">Reach out with your event details</p>
          </div>
          <div className="text-center">
            <div className="bg-yellow-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
            <h3 className="font-bold mb-2">We Plan Together</h3>
            <p className="text-gray-700">Customize menu and logistics</p>
          </div>
          <div className="text-center">
            <div className="bg-yellow-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
            <h3 className="font-bold mb-2">We Bring the Party</h3>
            <p className="text-gray-700">Fresh pizzas cooked on-site at 1000°F</p>
          </div>
        </div>
      </div>

      {/* What's Included */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">What You Get</h2>
        <ul className="space-y-3">
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Mobile Gozney Arc brick oven setup at your location</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Fresh, handcrafted 10-inch thin crust pizzas</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Cooked to perfection in ~60 seconds at 1000°F</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Variety of classic and specialty pizzas</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Professional setup and cleanup</span>
          </li>
        </ul>
      </div>

      {/* Pizza Classes */}
      <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg p-6 shadow-md mb-8 border-2 border-orange-300">
        <h2 className="text-2xl font-bold mb-4">👨‍🍳 Pizza Making Classes</h2>
        <p className="text-gray-700 mb-4">
          Learn the art of authentic brick oven pizza making! Perfect for team building, date nights, or just for fun.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold mb-2">What You'll Learn:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Dough stretching techniques</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Sauce and topping combinations</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Brick oven cooking methods</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Tips and tricks from a pro</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2">Class Details:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Hands-on experience for all participants</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Everyone makes and eats their own pizza</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Great for groups of 8-20 people</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>All ingredients and equipment provided</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">Pricing</h2>
        <p className="text-gray-700 mb-4">
          Ideal for groups of 25-200 people. Pricing varies based on guest count, location, and menu selection.
        </p>
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
          <p className="font-bold text-lg">Starting at $8 per pizza</p>
          <p className="text-gray-700 mt-2">Contact us for a custom quote based on your event needs</p>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p className="font-semibold mb-2">For Larger Groups (50+ guests):</p>
          <p className="text-gray-700">
            We offer buffet-style service with 3-5 signature pizza varieties to keep the line moving and everyone happy!
          </p>
        </div>
      </div>

      {/* Service Area */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">Service Area</h2>
        <p className="text-gray-700">
          We're based in Bountiful, Utah area and happy to travel! Contact us to confirm we can reach your location.
        </p>
      </div>

      {/* Contact CTA */}
      <div className="block bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold text-center py-6 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
        <h2 className="text-3xl font-bold mb-4">Ready to Book Your Event?</h2>
        <p className="text-xl mb-6">Let's make your next gathering unforgettable!</p>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-6">
          <a
            href="mailto:jj.backyardbrickoven@gmail.com"
            className="inline-block bg-white text-orange-600 font-bold text-lg py-4 px-6 rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-md"
          >
            📧 jj.backyardbrickoven@gmail.com
          </a>
          <a
            href="sms:+18018723439"
            className="inline-block bg-white text-orange-600 font-bold text-lg py-4 px-6 rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-md"
          >
            💬 Text: (801) 872-3439
          </a>
        </div>
        <p className="mt-4 text-sm">
          Include your event date, location, estimated guest count, and any questions!
        </p>
      </div>
    </div>
  )
}

export default Inquiries
