import React, { useEffect } from 'react'

const ImagePreloader = () => {
  const importAll = (r) => r.keys().map(r)
  const images = importAll(
    require.context('../../assets/pizzas', false, /\.(jpg)$/)
  )
  useEffect(() => {
    images.forEach((imageUrl) => {
      const img = new Image()
      img.src = imageUrl
    })
  }, [images])

  return null
}

export default ImagePreloader
