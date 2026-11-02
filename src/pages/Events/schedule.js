// Dough timing and weather for events. Pure date math plus two small fetches to
// Open-Meteo (free, no key). The reminder emails in functions/events.js use the
// same rules, so keep the two in step.

// Poolish goes in the night before mix day; mix day is the day before the event.
// Change these on the Events page under "Dough reminders".
export const DEFAULT_REMINDERS = {
  poolishDaysBefore: 2,
  mixDaysBefore: 1,
  emails: [], // empty = the business inbox
}

const pad = (v) => String(v).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const parseISO = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''))
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null
}

export const todayISO = () => iso(new Date())

export const addDays = (value, days) => {
  const d = parseISO(value)
  if (!d) return ''
  d.setDate(d.getDate() + days)
  return iso(d)
}

export const daysUntil = (value, from = todayISO()) => {
  const a = parseISO(from)
  const b = parseISO(value)
  return a && b ? Math.round((b - a) / 86400000) : null
}

// { poolish, mix } dates (YYYY-MM-DD) for an event date.
export const doughDates = (date, reminders = DEFAULT_REMINDERS) =>
  parseISO(date)
    ? {
        poolish: addDays(date, -Number(reminders.poolishDaysBefore || 0)),
        mix: addDays(date, -Number(reminders.mixDaysBefore || 0)),
      }
    : null

// Open-Meteo forecasts reach 16 days ahead.
export const FORECAST_DAYS = 16

// Place names to try for a location, most specific first. Open-Meteo's
// geocoder knows towns, not street addresses, so "123 Main St, Bountiful, UT
// 84010" becomes ["123 Main St, Bountiful, UT 84010", "Bountiful"].
export const placeCandidates = (location) => {
  const text = String(location || '').trim()
  if (!text) return []
  const parts = text
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p && !/^\d/.test(p) && !/^[A-Z]{2}(\s+\d{5})?$/i.test(p) && !/^(utah|usa|us|united states)$/i.test(p))
  return [...new Set([text, ...parts.reverse()])]
}

export const geocode = async (location) => {
  for (const name of placeCandidates(location)) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?count=1&countryCode=US&name=${encodeURIComponent(name)}`
    const res = await fetch(url)
    if (!res.ok) continue
    const hit = ((await res.json()).results || [])[0]
    if (hit) return { lat: hit.latitude, lon: hit.longitude, label: [hit.name, hit.admin1].filter(Boolean).join(', ') }
  }
  return null
}

const CODES = [
  [[0], 'Clear'],
  [[1, 2], 'Partly cloudy'],
  [[3], 'Overcast'],
  [[45, 48], 'Fog'],
  [[51, 53, 55, 56, 57], 'Drizzle'],
  [[61, 63, 65, 66, 67, 80, 81, 82], 'Rain'],
  [[71, 73, 75, 77, 85, 86], 'Snow'],
  [[95, 96, 99], 'Thunderstorms'],
]
export const describeCode = (code) => (CODES.find(([list]) => list.includes(code)) || [null, ''])[1]

// Daily forecast for one date at a point, or null if the date is outside the
// forecast window. { high, low, rainChance, wind, summary } in °F and mph.
export const forecast = async ({ lat, lon }, date) => {
  const days = daysUntil(date)
  if (days == null || days < 0 || days >= FORECAST_DAYS) return null
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,weather_code',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'America/Denver',
    start_date: date,
    end_date: date,
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) throw new Error(`forecast ${res.status}`)
  const d = (await res.json()).daily || {}
  const at = (key) => (d[key] || [])[0]
  return {
    high: Math.round(at('temperature_2m_max')),
    low: Math.round(at('temperature_2m_min')),
    rainChance: at('precipitation_probability_max'),
    wind: Math.round(at('wind_speed_10m_max')),
    summary: describeCode(at('weather_code')),
  }
}

// One line: "Partly cloudy, 41–58°F, 20% rain, wind 12 mph"
export const weatherLine = (w) =>
  w
    ? [w.summary, `${w.low}–${w.high}°F`, w.rainChance != null ? `${w.rainChance}% rain` : '', w.wind ? `wind ${w.wind} mph` : '']
        .filter(Boolean)
        .join(', ')
    : ''

// Things worth a heads-up for an outdoor oven and stretching dough outside.
export const weatherFlags = (w) => {
  if (!w) return []
  const flags = []
  if (w.low < 45) flags.push('Cold: hard to stretch dough outside')
  if (w.rainChance >= 40) flags.push('Rain likely: bring cover')
  if (w.wind >= 20) flags.push('Windy: stake the canopy')
  if (w.high >= 95) flags.push('Hot: watch toppings and dough')
  return flags
}
