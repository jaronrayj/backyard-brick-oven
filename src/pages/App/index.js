import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import MainPage from '../MainPage'
import Navbar from '../Navbar'
import Order from '../Order'
import Inquiries from '../Inquiries'
import Hello from '../Hello'
import { isTeamPath } from '../../utils/teamPaths'
import { startTracking, track } from '../../utils/track'

// Team pages (and the team bar with its notifications code) load only when
// opened, so the public site doesn't download them, and a change to one of
// them doesn't make visitors re-download everything.
const MenuAdmin = lazy(() => import('../MenuAdmin'))
const Planner = lazy(() => import('../Planner'))
const Team = lazy(() => import('../Team'))
const Events = lazy(() => import('../Events'))
const TeamNav = lazy(() => import('../../components/TeamNav'))

export const isSiteReadyForOrders = true

// Team tabs switch pages inside the app (no full reload), so the bars stay put.
const Shell = () => {
  const { pathname } = useLocation()
  const team = isTeamPath(pathname)
  const navigate = useNavigate()
  // A notification tapped while the site is open: the service worker
  // (public/firebase-messaging-sw.js) brings this window forward and sends
  // the path to open.
  useEffect(() => {
    const sw = navigator.serviceWorker
    if (!sw) return undefined
    const onMessage = (e) => {
      const d = e.data || {}
      if (d.bybo === 'open' && typeof d.path === 'string' && d.path.startsWith('/')) navigate(d.path)
    }
    sw.addEventListener('message', onMessage)
    sw.startMessages()
    return () => sw.removeEventListener('message', onMessage)
  }, [navigate])
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0)
  }, [pathname])
  // Visitor tracking on the public pages only (see utils/track.js).
  useEffect(() => {
    if (team) return
    startTracking()
    track('visit')
    const path = pathname.replace(/\/$/, '')
    if (path === '/inquiries') track('inquiries_view')
    if (path === '/hello') track('hello_view')
  }, [pathname, team])
  return (
    <div className={team ? 'min-h-screen bg-gray-50' : undefined}>
      {team ? (
        <Suspense fallback={<div className="h-14 bg-white border-b border-gray-200" />}>
          <TeamNav />
        </Suspense>
      ) : (
        <Navbar />
      )}
      <div className="text-center justify-center">
        <Suspense fallback={<p className="py-10 text-sm text-gray-500">Loading…</p>}>
        <Routes>
          <Route exact path="/" element={<MainPage />} />
          <Route exact path="/order" element={<Order />} />
          <Route exact path="/inquiries" element={<Inquiries />} />
          <Route exact path="/hello" element={<Hello />} />
          <Route exact path="/admin/menu" element={<MenuAdmin />} />
          <Route exact path="/planner" element={<Planner />} />
          <Route exact path="/team" element={<Team />} />
          <Route exact path="/events" element={<Events />} />
          <Route exact path="/events/wrapup" element={<Navigate replace to="/planner#wrapup" />} />
        </Routes>
        </Suspense>
      </div>
      {!team && (
        <footer className="text-center py-6 text-xs text-gray-400">
          <a href="/team" className="hover:text-gray-700">Team sign-in</a>
        </footer>
      )}
    </div>
  )
}

const App = () => (
  <Router>
    <Shell />
  </Router>
)

export default App
