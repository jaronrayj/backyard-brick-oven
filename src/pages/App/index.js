import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import MainPage from '../MainPage'
import Navbar from '../Navbar'
import Order from '../Order'
import Inquiries from '../Inquiries'
import MenuAdmin from '../MenuAdmin'
import Planner from '../Planner'
import Team from '../Team'
import Events from '../Events'
import WrapUp from '../Events/WrapUp'

export const isSiteReadyForOrders = true

const App = () => {
  return (
    <div>
      <Navbar />
      <div className="text-center justify-center">
        <Router>
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
        </Router>
      </div>
      <footer className="text-center py-6 text-xs text-gray-400">
        <a href="/team" className="hover:text-gray-700">Team sign-in</a>
      </footer>
    </div>
  )
}

export default App
