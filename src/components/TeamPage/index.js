import React from 'react'

// One look for every team page (Planner, Events, Wrap-up, Menu, Team).
// Pages use these instead of their own wrappers, headings and button styles.

export const ui = {
  input: 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500',
  btn: 'inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50',
  card: 'bg-white border border-gray-200 rounded-xl p-4 shadow-sm',
}
ui.btnPrimary = `${ui.btn} bg-amber-600 border-amber-600 text-white hover:bg-amber-700`
ui.btnQuiet = `${ui.btn} bg-white border-gray-300 text-gray-700 hover:border-gray-900`

// Page body: same width, padding and spacing everywhere. Extra bottom padding
// on phones leaves room for the tab bar.
export const TeamPage = ({ children, wide = false }) => (
  <div className={`${wide ? 'max-w-4xl' : 'max-w-3xl'} mx-auto px-4 pt-5 pb-28 sm:pb-12 space-y-4 text-left`}>{children}</div>
)

// Page title with optional actions on the right (they wrap under it on phones).
export const PageHeader = ({ title, sub, children }) => (
  <div className="flex items-start justify-between gap-3 flex-wrap">
    <div className="min-w-0">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
    </div>
    {children && <div className="flex gap-2 flex-wrap">{children}</div>}
  </div>
)
