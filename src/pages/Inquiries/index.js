import React from 'react'
import nightPizza from '../../assets/night_pizza.jpg'
import pizzaParty from '../../assets/pizza_party.jpg'

const Inquiries = () => {
  return (
    <div className="bg-slate-200 lg:w-3/4 m-auto p-8">

      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          The Easiest Way to Impress Your Guests
        </h1>
        <p className="text-xl text-gray-700 mb-6">
          We bring a brick oven to your event and serve incredible Neapolitan-style pizza — hot, fast, and nonstop.
        </p>
        <img
          src={pizzaParty}
          alt="Brick oven pizza catering setup"
          className="rounded-xl mx-auto shadow-md max-h-80 object-cover"
        />
        <p className="mt-6 text-gray-700 max-w-2xl mx-auto">
          No food stress. No long lines. No cleanup. Just really, really good pizza your guests won't stop talking about.
        </p>
      </div>

      {/* Speed / Differentiator */}
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded mb-8">
        <p className="font-semibold text-gray-800">
          Pizzas cook in about 60 seconds — so the line keeps moving and everyone eats fresh.
        </p>
      </div>

      {/* What You Get */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-8 transition-shadow duration-200 hover:shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Full-Service Experience</h2>
        <div className="grid md:grid-cols-2 gap-4 text-gray-700">
          <div className="flex items-start">
            <span className="text-green-600 mr-2 mt-1">✓</span>
            <span>On-site brick oven setup</span>
          </div>
          <div className="flex items-start">
            <span className="text-green-600 mr-2 mt-1">✓</span>
            <span>10" artisan pizzas cooked fresh in ~60 seconds</span>
          </div>
          <div className="flex items-start">
            <span className="text-green-600 mr-2 mt-1">✓</span>
            <span>Classic + specialty pizzas for all tastes</span>
          </div>
          <div className="flex items-start">
            <span className="text-green-600 mr-2 mt-1">✓</span>
            <span>Setup, service, and cleanup handled for you</span>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-stone-50 rounded-lg p-6 shadow-md mb-8 transition-shadow duration-200 hover:shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Simple. Stress-Free. Done.</h2>
        <p className="text-gray-600 mb-6">Three steps and you're set.</p>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-yellow-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
            <h3 className="font-bold mb-1">Tell Us About Your Event</h3>
            <p className="text-gray-700">Date, guest count, location — that's all we need to start</p>
          </div>
          <div className="text-center">
            <div className="bg-yellow-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
            <h3 className="font-bold mb-1">We Plan It With You</h3>
            <p className="text-gray-700">Choose from our pizzas or build a custom menu</p>
          </div>
          <div className="text-center">
            <div className="bg-yellow-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
            <h3 className="font-bold mb-1">We Show Up & Cook</h3>
            <p className="text-gray-700">We handle everything — you enjoy your event</p>
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-8 transition-shadow duration-200 hover:shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Perfect for Any Event</h2>
        <p className="text-gray-600 mb-4">
          Birthdays, weddings, corporate events, graduations, neighborhood parties — we've done it all. Groups of 25–200.
        </p>
        <div className="p-4 bg-gray-50 rounded">
          <p className="font-semibold mb-1">Big crowd? No problem.</p>
          <p className="text-gray-700">
            We run continuous service with rotating pizzas, so guests can grab fresh slices anytime — no long waits.
          </p>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-slate-50 rounded-lg p-6 shadow-md mb-8 transition-shadow duration-200 hover:shadow-lg">
        <h2 className="text-2xl font-bold mb-4">What People Say</h2>
        <p className="italic text-gray-700 mb-3">
          "Best food at the party — hands down. People were going back for thirds."
        </p>
        <p className="italic text-gray-700">
          "All our guests raved about it!"
        </p>
      </div>

      {/* Pizza Classes */}
      <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg p-8 shadow-md mb-8 border-2 border-orange-300 transition-shadow duration-200 hover:shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Want to Make Your Own Pizza?</h2>
        <div className="md:flex gap-8">
          <img
            src={nightPizza}
            alt="Pizza class"
            className="rounded-xl md:w-1/2 mb-6 md:mb-0 object-cover max-h-72"
          />
          <div className="text-gray-700 flex flex-col justify-center space-y-4">
            <p>
              We offer hands-on pizza classes for groups of 8–30. Perfect for date nights, team events, or just a fun night with friends.
            </p>
            <div>
              <p className="font-semibold mb-1">You'll learn:</p>
              <p>Dough stretching, topping combinations, and how to cook in a real brick oven.</p>
            </div>
            <p>
              Everyone makes (and eats) their own pizza. We bring everything — you just show up hungry.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-8 transition-shadow duration-200 hover:shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Pricing</h2>
        <p className="text-gray-700 mb-2">
          Every event is a little different, but most fall between <strong>$12–$18 per person</strong>.
        </p>
        <p className="text-gray-700">
          Reach out and we'll put together a quick, no-pressure quote based on your event.
        </p>
      </div>

      {/* Service Area */}
      <div className="bg-stone-50 rounded-lg p-6 shadow-md mb-8 transition-shadow duration-200 hover:shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Service Area</h2>
        <p className="text-gray-700">
          Based in Bountiful, Utah. We travel throughout Northern Utah — just ask!
        </p>
      </div>

      {/* CTA */}
      <div className="bg-amber-600 text-white font-bold text-center py-6 px-8 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold mb-4">Check Your Date</h2>
        <p className="text-xl mb-6">
          Text us your date and guest count — we'll get you a quick quote.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-6">
          <a
            href="sms:+18018723439"
            className="inline-block bg-white text-orange-600 font-bold text-lg py-4 px-6 rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-md"
          >
            Text: (801) 872-3439
          </a>
          <a
            href="mailto:jj.backyardbrickoven@gmail.com"
            className="inline-block bg-white text-orange-600 font-bold text-lg py-4 px-6 rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-md"
          >
            Email Us
          </a>
        </div>
        <p className="mt-4 text-sm">
          Include your date, location, and guest count — we'll take it from there.
        </p>
      </div>

    </div>
  )
}

export default Inquiries
