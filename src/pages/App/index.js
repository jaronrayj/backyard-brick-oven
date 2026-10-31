import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import Login from '../Login'
import MainPage from '../MainPage'
import Register from '../Register'
import ResetPassword from '../ResetPassword'
import Navbar from '../Navbar'
import Order from '../Order'
import Admin from '../Admin'
import Inquiries from '../Inquiries'
import MenuAdmin from '../MenuAdmin'
import Planner from '../Planner'
import Team from '../Team'

export const isSiteReadyForOrders = true

const App = () => {
  return (
    <div>
      <Navbar />
      <div className="text-center justify-center">
        <Router>
          <Routes>
            <Route exact path="/" element={<MainPage />} />
            <Route exact path="/login" element={<Login />} />
            <Route exact path="/order" element={<Order />} />
            <Route exact path="/inquiries" element={<Inquiries />} />
            <Route exact path="/register" element={<Register />} />
            <Route exact path="/reset_password" element={<ResetPassword />} />
            <Route exact path="/admin" element={<Admin />} />
            <Route exact path="/admin/menu" element={<MenuAdmin />} />
            <Route exact path="/planner" element={<Planner />} />
            <Route exact path="/team" element={<Team />} />
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
