import React from 'react'

const carouselImages = [
  'https://lh3.googleusercontent.com/pw/AIL4fc_L-n4nodNjQRRJFg-kQMmtZBtEnYEdgIyiFNfTpocdwe6_cAksNqkNxtdzUq6lVmcT8KIf9xLjRqrOpn73TCNG_ZVPfwsNyV9m2RuWDtBHAnFGqI-2=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc-K7KMLXGN1hCh1xL4FBDb8YnlRQ_wgj3HJSh6E3iYD3RTeRAtCL1cb3cS4Q2Hufxwp2vwcMh7ctsVpXFRFi8WBRBRQabyXW624Iei8hyQ-guY_fM3n=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc_pL_HEOo-QrVMF0AjN8QWPJGiQlt_Jg1LJNoNkE4qfu2qnei0Hns8ZKgMTWyLJSyBpjnJEhrHsEhG9gkiqwJiX74bK6ZJ-6HwLLPeyJHGfgSQmFdip=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc-gXV5kIdkrB5QQwGXhXAKS_-fWSSX5zEGo-SWBvLk_YbfaHxN5EaVxLuHv8W014rNB5s7hR9IJDR1gg0QPOZXVUvqJx3oO5uGA2ix0805Iqx5vNigx=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc-9_u0sYhZIJL88S8K1iO3pBM1kUNqzmijgZo-7yI0bEB0ihsNQre8qleT0ixt9Ggy_8WwQmD3h7fzFWYsZ7SPtma7dY93ZzAyYUwfh_LHX4nNA1mkX=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc8nVXymGIsFq-lsToL8y18J4xNiM6XtSQIw2Pf8jycKevEha0BA6j-N8gSHbwLeSRjQb_mF_flqdff0t_3YI5gbpiNv87tSBCOy1E4n8cctsLMKUPIu=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc8ojiFQEibGbaD8-TVLiM2os_bwJes497UFMiLIDVHcGvjvvRxy9CuvLnEhX0pj0hKlFFsZsBTwEIrr6Qj6YkJ_y1brGCxsQXp_aCyDZyePK1oaHzQU=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc8rhP4WKiAAT5sctP090H34i4vrOvaHk5fDp0NhKCK5M3AsULwypNzjdHL6mKMJFUk6fxvnO5vLfZ__7mJRkWaEQvmXmP7FxSyWbqurANNweuUAtjd4=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc_c_tmrfOkON9QlM1fBgAGBvk5wCjSzuDirjGRxsOsh5aQ9EBcO8b999pkAISBfCEmJ6nRWe7rgFfd5P___0cOzLw9AjhXNfnwTDbol9spT2fpOJbeH=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc9tHC4EqEGj0NPMSb_xRlzsJh8sUGHNhBYdcneE_KefsgrOPIPnt_8KwzCcGNLu7HIDTIm0wmOScarim2nf6yILvqz3KS5A6S5tUKYy-j0IPmHxWLpM=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc_pDK6AE1fM5WeqnnGfhh8wvHjpW8y1NEdxAVlSUu0ny0baR07GOvWHBtCBVvxy_sy3gwjwQ2rUOcO945VrPueUVR2NNvodkYGlv34PUXA496Xd3j2h=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc9LXOJKZcJlVY-UU0-kofrCLtF7yXlixNPlARodOmwstL1rb6rp_GK9lwIjH4pvCwM1byXzCgP5r8xwtsKiANE9xpJt8wpLUGUBi5zldKctnJa_wEHb=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc-zY2TMfMbsF_QSlI_i57Dedxdp8aMmbFBljwfA6tWjRnePYHZVn6rMm7JlKSDxj443KwKBM1A5ij3VJEkKu6LrvbX9d9ZNdL0CJ0IxYhkQxfixExeK=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc8sGY-P1SpT8jK9UdZPu9PkapUAlr2jZyQVRzlVqzvNKQUN0r_llk26WHR7gY5HjVPGUN0X3W1Sen6201N7T99U-6uu9SRdRfkqcv-qRXiBDCpjPUf2=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc9w7uzL6pI5--8eVjedebro5vHN0CQ4l6KNI6UD1-KCeOIBr3ElOvzEN-OLcolwqjQzB7Wz-1t3-4MvwiJY-G9daEa6NGDh7VsRmJKCyUuUSN30PHMW=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc8gWDk6adUM3uM95l-DSAPyoiRSGuLwAA2muJ3OOck4A0toDG2LuJNCH2wn98i67m3y6il_ZSs5x09hkaJID88C1koTpSAvPI1wwy7e0pCPtH1y9ksF=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc_9yHloE0QvRnddMC4bF6lcLcAl0HpXnL7S8NyYciH6f3sCp4pWtZnw_tBrYfypNHo79Pbw_bHf-sYXTAosoHHBa94NBeTDeHexzg11tGDT7Wl9keGd=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc_p-NF_hh3Uzrjl_w20lofApG75s-qO38n_DKcvWm3FotbLnSxrkChG36GzsQAabFBBnF4BFi3LxW3jhohcycWrLiRzxDODFzOcMe1wQx1HCvgQp3Zu=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc8DJtDgpOdtkCJnxLo0MDLf4Djbt5H5okWuEodYg6BPFK5OjbPKVjZB77Y6WM7krkTviIya0jvsXD6gZxcPcH-IHxLaPwj1oQdcPnOpXTr0flXtwH2r=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc8TqLP_z4VX9ZhSxBU6cU2qYVUUIhvSBj37xvKO3y6XiBAHXx-k1wwHKjcFbT9lY1Aij9uquainHxzeUr1qMz-bnj6-oCCIaNac6-MlSiwV6L4QTopM=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc-uqcYA8OgoM4eXOke-UT3Zdzzsy7GK5MzS8iiKo-cjYTSDZF5Ro7mq3uZ5IlZkmxk9rLpXhy9CJRIHvh6ZgpE232mVFOp6yj6nkb-vVEZ7gCJkSJip=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc8auPqnKCc4_rMXO1IzoUASX32CzxHaBr-jbGx5sMkhbrGphmig-1Oe33-JV6bn1JqXjpVPqbG0Q3MF4FFRMQtwMK1txmUC_9vkdoluTXRyB9PF-oU7=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc-GluZUdaZgmmrzZszyCDQfYz6C9P3YP8rkGSFyjh9aENuBYRXf7c78NaeNyLRSgnfBXK5w1uVMcFVF2EWVYvIQRk7dcvXbh39QjBSRnEQEzXx9w_HW=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc9ZIjJldMoZ78J53CBtboSlksFOWJpd9um3ACwLzgDvIRddHnb3H_3mXNmeHppkdGCZianCp9Man4oEasibj5_dezHKJcTG-AvK-Kf859VohzN2Oqqa=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc-WxEAdRCs8Je47O7XoZdufkc1qpdOORH0fspAccoXlle7v69BgeqEn6wIWQSzNv54g5G3B9HO69ESWdeOO5Fsx6jnnunaJylCGXgXfhrp7Uxt0ePxq=w1920-h1080',
  'https://lh3.googleusercontent.com/pw/AIL4fc8w79Gwpk95qD0Zj6SIe1TbUE68lriLLmh1A9gzKTR3_0-atEFXwJ9kP4zzVt1nCF4Y2uPyymegmmE_hvCXSFQCAjjCfV-j7gwjwwaUDSeMleKEyT4e=w1920-h1080',
]

const Carousel = () => (
  <div
    className="pa-carousel-widget"
    style={{ width: '100%', height: 480, display: 'none' }}
    data-link="https://photos.app.goo.gl/2WiVCkWL2iW2nSrA6"
    data-title="Backyard Brick Oven Pizza"
    data-description="8 new items added to shared album"
    data-delay="3"
    data-background-color="#FFFFFF"
  >
    {carouselImages.map((image, index) => (
      <object key={index} data={image} aria-label={image}></object>
    ))}
  </div>
)

export default Carousel
