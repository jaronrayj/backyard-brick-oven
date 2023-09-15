import React from 'react';
import jaronPicture from '../../assets/jare-pizza-action.jpeg';
import venmoLogo from '../../assets/venmo.png';
import facebookLogo from '../../assets/facebook.png';
import instagramLogo from '../../assets/instagram.png';
import Map from '../../components/Map';

const MainPage = () => {
  const location = {
    address: '156 East 550 North Bountiful, UT 84010',
    lat: 40.89523,
    lng: -111.87739,
  };

  return (
    <>
      <div className="bg-white mt-8 md:w-2/3 m-auto">
        <div className="p-8">
          <div className="md:flex">
            <div className="md:w-1/2 align-middle">
              <img src={jaronPicture} alt="cooking pizza" />
            </div>
            <div className="md:w-1/2 bg-slate-200 rounded-md ml-8 p-8 text-lg">
              {/* <p>
                Hey! My name is Jaron, and I{' '}
                <span className="italic">really</span> enjoy making pizza! I
                have 2 Gozney Domes© that stay hot around 850°F and can cook a
                pie in about 75 seconds.
              </p> */}
              <p className="mt-8">
                Come enjoy <span className="font-bold">Pizza Friday</span> in
                our backyard from <span className="font-bold">5pm-7pm</span>!
                Choose from our selection of homemade sauces and toppings that
                tickle your fancy and we'll make it for you on the spot for $7
                each.
              </p>
              <p className="mt-8">
                We have two propane powered Gozney Domes© that maintain around
                850°F and can cook a pie in about 70 seconds. Each pizza is
                about 9-10 inches. We accept Venmo or cash.
              </p>

              <div className="flex justify-center mt-4">
                <div className="mt-auto mb-auto">
                  <a
                    href="https://goo.gl/maps/sQ3ZoUpVgMqc2aZg8"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="pointer-events-auto text-xl decoration-red-600 underline font-bold">
                      Click here for directions to our backyard
                    </div>
                  </a>
                </div>
              </div>
              <div className="flex justify-center">
                <a
                  href="https://www.instagram.com/backyardbrickovenllc/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img className="w-14" src={instagramLogo} alt="Jaron Venmo" />
                </a>
                <a
                  href="https://www.facebook.com/people/Backyard-Brick-Oven-LLC/100090391791253/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img className="w-14" src={facebookLogo} alt="Jaron Venmo" />
                </a>
                <a
                  href="https://account.venmo.com/u/Jaron-Johnson-4"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img className="w-14" src={venmoLogo} alt="Jaron Venmo" />
                </a>
              </div>
              <div className="flex justify-center mt-4">
                <div className="mt-auto mb-auto">
                  We take a few Fridays off, follow our social media to stay in
                  touch!
                </div>
              </div>
              <br />
              <div className="font-bold text-xl"> Current Toppings</div>
              <div className="columns-2">
                <ul className="list-inside">
                  <li>Marinara</li>
                  <li>Creamy pesto</li>
                  <li>Mozzarella</li>
                  <li>Balsamic Roasted Tomatoes</li>
                  <li>Caramelized Onions</li>
                  <li>Sriracha Chicken</li>
                  <li>Bacon</li>
                  <li>Italian Sausage</li>
                  <li>Pepperoni</li>
                  <li>Fresh Pineapple</li>
                  <li>Bell Peppers</li>
                  <li>Jalapenos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <script
          src="https://cdn.jsdelivr.net/npm/publicalbum@latest/embed-ui.min.js"
          async
        ></script>
        <div
          className="pa-carousel-widget"
          style={{ width: '100%', height: 480, display: 'none' }}
          data-link="https://photos.app.goo.gl/2WiVCkWL2iW2nSrA6"
          data-title="Backyard Brick Oven Pizza"
          data-description="8 new items added to shared album"
          data-delay="3"
          data-background-color="#FFFFFF"
        >
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc_L-n4nodNjQRRJFg-kQMmtZBtEnYEdgIyiFNfTpocdwe6_cAksNqkNxtdzUq6lVmcT8KIf9xLjRqrOpn73TCNG_ZVPfwsNyV9m2RuWDtBHAnFGqI-2=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc_L-n4nodNjQRRJFg-kQMmtZBtEnYEdgIyiFNfTpocdwe6_cAksNqkNxtdzUq6lVmcT8KIf9xLjRqrOpn73TCNG_ZVPfwsNyV9m2RuWDtBHAnFGqI-2=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc-K7KMLXGN1hCh1xL4FBDb8YnlRQ_wgj3HJSh6E3iYD3RTeRAtCL1cb3cS4Q2Hufxwp2vwcMh7ctsVpXFRFi8WBRBRQabyXW624Iei8hyQ-guY_fM3n=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc-K7KMLXGN1hCh1xL4FBDb8YnlRQ_wgj3HJSh6E3iYD3RTeRAtCL1cb3cS4Q2Hufxwp2vwcMh7ctsVpXFRFi8WBRBRQabyXW624Iei8hyQ-guY_fM3n=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc_pL_HEOo-QrVMF0AjN8QWPJGiQlt_Jg1LJNoNkE4qfu2qnei0Hns8ZKgMTWyLJSyBpjnJEhrHsEhG9gkiqwJiX74bK6ZJ-6HwLLPeyJHGfgSQmFdip=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc_pL_HEOo-QrVMF0AjN8QWPJGiQlt_Jg1LJNoNkE4qfu2qnei0Hns8ZKgMTWyLJSyBpjnJEhrHsEhG9gkiqwJiX74bK6ZJ-6HwLLPeyJHGfgSQmFdip=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc-gXV5kIdkrB5QQwGXhXAKS_-fWSSX5zEGo-SWBvLk_YbfaHxN5EaVxLuHv8W014rNB5s7hR9IJDR1gg0QPOZXVUvqJx3oO5uGA2ix0805Iqx5vNigx=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc-gXV5kIdkrB5QQwGXhXAKS_-fWSSX5zEGo-SWBvLk_YbfaHxN5EaVxLuHv8W014rNB5s7hR9IJDR1gg0QPOZXVUvqJx3oO5uGA2ix0805Iqx5vNigx=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc-9_u0sYhZIJL88S8K1iO3pBM1kUNqzmijgZo-7yI0bEB0ihsNQre8qleT0ixt9Ggy_8WwQmD3h7fzFWYsZ7SPtma7dY93ZzAyYUwfh_LHX4nNA1mkX=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc-9_u0sYhZIJL88S8K1iO3pBM1kUNqzmijgZo-7yI0bEB0ihsNQre8qleT0ixt9Ggy_8WwQmD3h7fzFWYsZ7SPtma7dY93ZzAyYUwfh_LHX4nNA1mkX=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc8nVXymGIsFq-lsToL8y18J4xNiM6XtSQIw2Pf8jycKevEha0BA6j-N8gSHbwLeSRjQb_mF_flqdff0t_3YI5gbpiNv87tSBCOy1E4n8cctsLMKUPIu=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc8nVXymGIsFq-lsToL8y18J4xNiM6XtSQIw2Pf8jycKevEha0BA6j-N8gSHbwLeSRjQb_mF_flqdff0t_3YI5gbpiNv87tSBCOy1E4n8cctsLMKUPIu=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc8ojiFQEibGbaD8-TVLiM2os_bwJes497UFMiLIDVHcGvjvvRxy9CuvLnEhX0pj0hKlFFsZsBTwEIrr6Qj6YkJ_y1brGCxsQXp_aCyDZyePK1oaHzQU=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc8ojiFQEibGbaD8-TVLiM2os_bwJes497UFMiLIDVHcGvjvvRxy9CuvLnEhX0pj0hKlFFsZsBTwEIrr6Qj6YkJ_y1brGCxsQXp_aCyDZyePK1oaHzQU=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc8rhP4WKiAAT5sctP090H34i4vrOvaHk5fDp0NhKCK5M3AsULwypNzjdHL6mKMJFUk6fxvnO5vLfZ__7mJRkWaEQvmXmP7FxSyWbqurANNweuUAtjd4=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc8rhP4WKiAAT5sctP090H34i4vrOvaHk5fDp0NhKCK5M3AsULwypNzjdHL6mKMJFUk6fxvnO5vLfZ__7mJRkWaEQvmXmP7FxSyWbqurANNweuUAtjd4=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc_c_tmrfOkON9QlM1fBgAGBvk5wCjSzuDirjGRxsOsh5aQ9EBcO8b999pkAISBfCEmJ6nRWe7rgFfd5P___0cOzLw9AjhXNfnwTDbol9spT2fpOJbeH=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc_c_tmrfOkON9QlM1fBgAGBvk5wCjSzuDirjGRxsOsh5aQ9EBcO8b999pkAISBfCEmJ6nRWe7rgFfd5P___0cOzLw9AjhXNfnwTDbol9spT2fpOJbeH=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc9tHC4EqEGj0NPMSb_xRlzsJh8sUGHNhBYdcneE_KefsgrOPIPnt_8KwzCcGNLu7HIDTIm0wmOScarim2nf6yILvqz3KS5A6S5tUKYy-j0IPmHxWLpM=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc9tHC4EqEGj0NPMSb_xRlzsJh8sUGHNhBYdcneE_KefsgrOPIPnt_8KwzCcGNLu7HIDTIm0wmOScarim2nf6yILvqz3KS5A6S5tUKYy-j0IPmHxWLpM=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc_pDK6AE1fM5WeqnnGfhh8wvHjpW8y1NEdxAVlSUu0ny0baR07GOvWHBtCBVvxy_sy3gwjwQ2rUOcO945VrPueUVR2NNvodkYGlv34PUXA496Xd3j2h=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc_pDK6AE1fM5WeqnnGfhh8wvHjpW8y1NEdxAVlSUu0ny0baR07GOvWHBtCBVvxy_sy3gwjwQ2rUOcO945VrPueUVR2NNvodkYGlv34PUXA496Xd3j2h=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc9LXOJKZcJlVY-UU0-kofrCLtF7yXlixNPlARodOmwstL1rb6rp_GK9lwIjH4pvCwM1byXzCgP5r8xwtsKiANE9xpJt8wpLUGUBi5zldKctnJa_wEHb=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc9LXOJKZcJlVY-UU0-kofrCLtF7yXlixNPlARodOmwstL1rb6rp_GK9lwIjH4pvCwM1byXzCgP5r8xwtsKiANE9xpJt8wpLUGUBi5zldKctnJa_wEHb=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc-zY2TMfMbsF_QSlI_i57Dedxdp8aMmbFBljwfA6tWjRnePYHZVn6rMm7JlKSDxj443KwKBM1A5ij3VJEkKu6LrvbX9d9ZNdL0CJ0IxYhkQxfixExeK=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc-zY2TMfMbsF_QSlI_i57Dedxdp8aMmbFBljwfA6tWjRnePYHZVn6rMm7JlKSDxj443KwKBM1A5ij3VJEkKu6LrvbX9d9ZNdL0CJ0IxYhkQxfixExeK=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc8sGY-P1SpT8jK9UdZPu9PkapUAlr2jZyQVRzlVqzvNKQUN0r_llk26WHR7gY5HjVPGUN0X3W1Sen6201N7T99U-6uu9SRdRfkqcv-qRXiBDCpjPUf2=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc8sGY-P1SpT8jK9UdZPu9PkapUAlr2jZyQVRzlVqzvNKQUN0r_llk26WHR7gY5HjVPGUN0X3W1Sen6201N7T99U-6uu9SRdRfkqcv-qRXiBDCpjPUf2=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc9w7uzL6pI5--8eVjedebro5vHN0CQ4l6KNI6UD1-KCeOIBr3ElOvzEN-OLcolwqjQzB7Wz-1t3-4MvwiJY-G9daEa6NGDh7VsRmJKCyUuUSN30PHMW=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc9w7uzL6pI5--8eVjedebro5vHN0CQ4l6KNI6UD1-KCeOIBr3ElOvzEN-OLcolwqjQzB7Wz-1t3-4MvwiJY-G9daEa6NGDh7VsRmJKCyUuUSN30PHMW=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc8gWDk6adUM3uM95l-DSAPyoiRSGuLwAA2muJ3OOck4A0toDG2LuJNCH2wn98i67m3y6il_ZSs5x09hkaJID88C1koTpSAvPI1wwy7e0pCPtH1y9ksF=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc8gWDk6adUM3uM95l-DSAPyoiRSGuLwAA2muJ3OOck4A0toDG2LuJNCH2wn98i67m3y6il_ZSs5x09hkaJID88C1koTpSAvPI1wwy7e0pCPtH1y9ksF=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc_9yHloE0QvRnddMC4bF6lcLcAl0HpXnL7S8NyYciH6f3sCp4pWtZnw_tBrYfypNHo79Pbw_bHf-sYXTAosoHHBa94NBeTDeHexzg11tGDT7Wl9keGd=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc_9yHloE0QvRnddMC4bF6lcLcAl0HpXnL7S8NyYciH6f3sCp4pWtZnw_tBrYfypNHo79Pbw_bHf-sYXTAosoHHBa94NBeTDeHexzg11tGDT7Wl9keGd=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc_p-NF_hh3Uzrjl_w20lofApG75s-qO38n_DKcvWm3FotbLnSxrkChG36GzsQAabFBBnF4BFi3LxW3jhohcycWrLiRzxDODFzOcMe1wQx1HCvgQp3Zu=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc_p-NF_hh3Uzrjl_w20lofApG75s-qO38n_DKcvWm3FotbLnSxrkChG36GzsQAabFBBnF4BFi3LxW3jhohcycWrLiRzxDODFzOcMe1wQx1HCvgQp3Zu=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc8DJtDgpOdtkCJnxLo0MDLf4Djbt5H5okWuEodYg6BPFK5OjbPKVjZB77Y6WM7krkTviIya0jvsXD6gZxcPcH-IHxLaPwj1oQdcPnOpXTr0flXtwH2r=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc8DJtDgpOdtkCJnxLo0MDLf4Djbt5H5okWuEodYg6BPFK5OjbPKVjZB77Y6WM7krkTviIya0jvsXD6gZxcPcH-IHxLaPwj1oQdcPnOpXTr0flXtwH2r=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc8TqLP_z4VX9ZhSxBU6cU2qYVUUIhvSBj37xvKO3y6XiBAHXx-k1wwHKjcFbT9lY1Aij9uquainHxzeUr1qMz-bnj6-oCCIaNac6-MlSiwV6L4QTopM=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc8TqLP_z4VX9ZhSxBU6cU2qYVUUIhvSBj37xvKO3y6XiBAHXx-k1wwHKjcFbT9lY1Aij9uquainHxzeUr1qMz-bnj6-oCCIaNac6-MlSiwV6L4QTopM=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc-uqcYA8OgoM4eXOke-UT3Zdzzsy7GK5MzS8iiKo-cjYTSDZF5Ro7mq3uZ5IlZkmxk9rLpXhy9CJRIHvh6ZgpE232mVFOp6yj6nkb-vVEZ7gCJkSJip=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc-uqcYA8OgoM4eXOke-UT3Zdzzsy7GK5MzS8iiKo-cjYTSDZF5Ro7mq3uZ5IlZkmxk9rLpXhy9CJRIHvh6ZgpE232mVFOp6yj6nkb-vVEZ7gCJkSJip=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc8auPqnKCc4_rMXO1IzoUASX32CzxHaBr-jbGx5sMkhbrGphmig-1Oe33-JV6bn1JqXjpVPqbG0Q3MF4FFRMQtwMK1txmUC_9vkdoluTXRyB9PF-oU7=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc8auPqnKCc4_rMXO1IzoUASX32CzxHaBr-jbGx5sMkhbrGphmig-1Oe33-JV6bn1JqXjpVPqbG0Q3MF4FFRMQtwMK1txmUC_9vkdoluTXRyB9PF-oU7=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc-GluZUdaZgmmrzZszyCDQfYz6C9P3YP8rkGSFyjh9aENuBYRXf7c78NaeNyLRSgnfBXK5w1uVMcFVF2EWVYvIQRk7dcvXbh39QjBSRnEQEzXx9w_HW=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc-GluZUdaZgmmrzZszyCDQfYz6C9P3YP8rkGSFyjh9aENuBYRXf7c78NaeNyLRSgnfBXK5w1uVMcFVF2EWVYvIQRk7dcvXbh39QjBSRnEQEzXx9w_HW=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc9ZIjJldMoZ78J53CBtboSlksFOWJpd9um3ACwLzgDvIRddHnb3H_3mXNmeHppkdGCZianCp9Man4oEasibj5_dezHKJcTG-AvK-Kf859VohzN2Oqqa=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc9ZIjJldMoZ78J53CBtboSlksFOWJpd9um3ACwLzgDvIRddHnb3H_3mXNmeHppkdGCZianCp9Man4oEasibj5_dezHKJcTG-AvK-Kf859VohzN2Oqqa=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc-WxEAdRCs8Je47O7XoZdufkc1qpdOORH0fspAccoXlle7v69BgeqEn6wIWQSzNv54g5G3B9HO69ESWdeOO5Fsx6jnnunaJylCGXgXfhrp7Uxt0ePxq=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc-WxEAdRCs8Je47O7XoZdufkc1qpdOORH0fspAccoXlle7v69BgeqEn6wIWQSzNv54g5G3B9HO69ESWdeOO5Fsx6jnnunaJylCGXgXfhrp7Uxt0ePxq=w1920-h1080"
          ></object>
          <object
            data="https://lh3.googleusercontent.com/pw/AIL4fc8w79Gwpk95qD0Zj6SIe1TbUE68lriLLmh1A9gzKTR3_0-atEFXwJ9kP4zzVt1nCF4Y2uPyymegmmE_hvCXSFQCAjjCfV-j7gwjwwaUDSeMleKEyT4e=w1920-h1080"
            aria-label="https://lh3.googleusercontent.com/pw/AIL4fc8w79Gwpk95qD0Zj6SIe1TbUE68lriLLmh1A9gzKTR3_0-atEFXwJ9kP4zzVt1nCF4Y2uPyymegmmE_hvCXSFQCAjjCfV-j7gwjwwaUDSeMleKEyT4e=w1920-h1080"
          ></object>
        </div>

        {/* <Map location={location} zoomLevel={19} /> */}
        <br />
        <p className="mx-3">
          We are open to catering! Hit us up on our social media or email us at{' '}
          <a
            className="pointer text-blue-900"
            href="jj.backyardbrickoven@gmail.com"
          >
            jj.backyardbrickoven@gmail.com
          </a>{' '}
          for any inquiries.
        </p>
        <br />
      </div>
    </>
  );
};

export default MainPage;
