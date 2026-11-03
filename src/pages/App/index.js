import { useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom'

import MainPage from '../MainPage'
import Navbar from '../Navbar'
import Order from '../Order'
import Inquiries from '../Inquiries'
import MenuAdmin from '../MenuAdmin'
import Planner from '../Planner'
import Team from '../Team'
import Events from '../Events'
import WrapUp from '../Events/WrapUp'
import TeamNav from '../../components/TeamNav'
import { isTeamPath } from '../../utils/useTeamAccess'
import { startTracking, track } from '../../utils/track'

export const isSiteReadyForOrders = true

// Team tabs switch pages inside the app (no full reload), so the bars stay put.
const Shell = () => {
  const { pathname } = useLocation()
  const team = isTeamPath(pathname)
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0)
  }, [pathname])
  // Visitor tracking on the public pages only (see utils/track.js).
  useEffect(() => {
    if (team) return
    startTracking()
    track('visit')
    if (pathname.replace(/\/$/, '') === '/inquiries') track('inquiries_view')
  }, [pathname, team])
  return (
    <div className={team ? 'min-h-screen bg-gray-50' : undefined}>
      {team ? <TeamNav /> : <Navbar />}
      <div className="text-center justify-center">
        <Routes>
          <Route exact path="/" element={<MainPage />} />
          <Route exact path="/order" element={<Order />} />
          <Route exact path="/inquiries" element={<Inquiries />} />
          <Route exact path="/admin/menu" element={<MenuAdmin />} />
          <Route exact path="/planner" element={<Planner />} />
          <Route exact path="/team" element={<Team />} />
          <Route exact path="/events" element={<Events />} />
          <Route exact path="/events/wrapup" element={<WrapUp />} />
        </Routes>
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
