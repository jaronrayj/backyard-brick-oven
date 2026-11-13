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

// Tapping a notification opens its link in the site. If the site is already
// open (often as the home-screen app), bring that window forward and tell it
// where to go (src/pages/App listens), rather than leaving it where it was.
// Added before firebase.messaging() so it runs first and the SDK's own click
// handling is skipped. The worker doesn't control the site's pages (its scope
// is Firebase's own), so it can't navigate them directly; it messages them.
self.addEventListener('notificationclick', (event) => {
  const msg = (event.notification.data || {}).FCM_MSG || {}
  const link = (msg.data && msg.data.link) || (msg.fcmOptions && msg.fcmOptions.link)
  if (!link) return
  event.stopImmediatePropagation()
  event.notification.close()
  const url = new URL(link, self.location.origin)
  const path = url.pathname + url.search + url.hash
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const win = wins.find((c) => new URL(c.url).origin === self.location.origin)
      if (win) {
        await win.focus()
        win.postMessage({ bybo: 'open', path })
        return
      }
      await self.clients.openWindow(self.location.origin + path)
    })()
  )
})

// Notifications carry their own title/body/link, so the SDK shows them itself.
firebase.messaging()
