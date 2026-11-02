/* Shows phone notifications sent from the Cloud Functions (functions/push.js)
   while the app is closed or in the background. Tapping one opens its link.
   Keep the version in step with the "firebase" package. */
importScripts('https://www.gstatic.com/firebasejs/9.6.8/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.6.8/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyB0Db6k61cOIzvwuQ_LHdJhL_XdUTkg0Ww',
  authDomain: 'backyard-brickoven.firebaseapp.com',
  projectId: 'backyard-brickoven',
  storageBucket: 'backyard-brickoven.appspot.com',
  messagingSenderId: '617331177853',
  appId: '1:617331177853:web:b1a726a44ad1a3654ff414',
})

// Notifications carry their own title/body/link, so the SDK shows them itself.
firebase.messaging()
