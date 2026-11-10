// Subscribe to Pizza Fridays: the site's own feed (functions/pizzaFridayFeed.js,
// /pizza-fridays.ics), built from the business calendar, so subscribers always
// see the Fridays that are actually planned.
export const PIZZA_FRIDAYS_FEED = 'backyardbrickovenpizza.com/pizza-fridays.ics'
// iPhone / Mac: opens Calendar's "Subscribe" sheet.
export const APPLE_CALENDAR = `webcal://${PIZZA_FRIDAYS_FEED}`
// Google Calendar: "Add calendar from URL", pre-filled.
export const GOOGLE_CALENDAR = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(`webcal://${PIZZA_FRIDAYS_FEED}`)}`
