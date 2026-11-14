// Tapping the team tab you're already on goes back to that page's main view,
// at the top (TeamNav fires it; each page decides what "main view" means).

const TAB_HOME = 'bybo-tab-home'

export const goTabHome = (key) => {
  window.dispatchEvent(new CustomEvent(TAB_HOME, { detail: key }))
  try {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e) {
    window.scrollTo(0, 0)
  }
}

// Run `fn` when the `key` tab is tapped again. Returns the unsubscribe.
export const onTabHome = (key, fn) => {
  const handler = (e) => {
    if (e.detail === key) fn()
  }
  window.addEventListener(TAB_HOME, handler)
  return () => window.removeEventListener(TAB_HOME, handler)
}
