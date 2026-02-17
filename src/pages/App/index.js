import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import Login from '../Login'
import MainPage from '../MainPage'
import Register from '../Register'
import ResetPassword from '../ResetPassword'
import Navbar from '../Navbar'
import Order from '../Order'
import Admin from '../Admin'
import Inquiries from '../Inquiries'

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
          </Routes>
        </Router>
      </div>
    </div>
  )
}

export default App
