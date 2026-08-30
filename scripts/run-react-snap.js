#!/usr/bin/env node
/*
 * react-snap ships an ancient bundled Chromium (via puppeteer@1) that cannot
 * parse modern JS (optional chaining, etc.), which crashes pre-rendering with
 * "SyntaxError: Unexpected token '?'". We fix this by pointing react-snap at a
 * modern Chrome that already exists on the machine / CI runner.
 *
 * Resolution order for the Chrome binary:
 *   1. PUPPETEER_EXECUTABLE_PATH env var (explicit override, used in CI)
 *   2. Common install locations per platform
 */
const fs = require('fs')
const reactSnap = require('react-snap')
const pkg = require('../package.json')

function firstExisting(paths) {
  return paths.find((p) => {
    try {
      return p && fs.existsSync(p)
    } catch {
      return false
    }
  })
}

const candidates = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  // Linux (GitHub Actions ubuntu-latest ships these)
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  // macOS
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
]

const executablePath = firstExisting(candidates)

if (!executablePath) {
  console.error(
    '[run-react-snap] Could not find a Chrome/Chromium binary. ' +
      'Set PUPPETEER_EXECUTABLE_PATH to a valid Chrome executable.'
  )
  process.exit(1)
}

console.log(`[run-react-snap] Using Chrome at: ${executablePath}`)

reactSnap
  .run({ ...(pkg.reactSnap || {}), puppeteerExecutablePath: executablePath })
  .then(() => {
    console.log('[run-react-snap] Pre-rendering complete.')
  })
  .catch((err) => {
    console.error('[run-react-snap] Pre-rendering failed:', err && err.message)
    process.exit(1)
  })
