import React, { useState, useCallback, useEffect } from 'react'

// Lightweight, dependency-free image carousel.
// - Prev/next arrows + dot indicators
// - Keyboard accessible (left/right arrows when focused)
// - Renders all slides in the DOM (opacity-toggled) so pre-rendering /
//   crawlers still see every image; no external widgets or expiring URLs.
const ImageCarousel = ({ images = [], className = '' }) => {
  const [current, setCurrent] = useState(0)
  const count = images.length

  const goTo = useCallback(
    (index) => {
      if (count === 0) return
      setCurrent(((index % count) + count) % count)
    },
    [count]
  )

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    },
    [next, prev]
  )

  // Auto-advance every 6s; pause is implicit when the tab is hidden.
  useEffect(() => {
    if (count <= 1) return undefined
    const id = setInterval(next, 6000)
    return () => clearInterval(id)
  }, [next, count])

  if (count === 0) return null

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl shadow-md ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Backyard Brick Oven event photos"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {/* Slides */}
      <div className="relative h-64 md:h-[28rem] bg-gray-100">
        {images.map((img, i) => (
          <img
            key={img.src}
            src={img.src}
            alt={img.alt}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              i === current ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={i === current ? undefined : true}
          />
        ))}
      </div>

      {/* Prev / Next */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous photo"
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl leading-none transition-colors"
      >
        &#8249;
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next photo"
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl leading-none transition-colors"
      >
        &#8250;
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to photo ${i + 1}`}
            aria-current={i === current ? 'true' : undefined}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === current ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default ImageCarousel
