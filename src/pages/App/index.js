import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";

import Login from "../Login";
import Placeholder from "../Placeholder";
import Register from "../Register";
import ResetPassword from "../ResetPassword";
import Dashboard from "../Dashboard";
import Navbar from "../Navbar";

const App = () => {
  return (
    <div className="App">
      <Navbar />
      <Router>
        <Routes>
          <Route exact path="/" element={<Placeholder />} />
          <Route exact path="/login" element={<Login />} />
          {/* <Route exact path="/order" element={<Order />} /> */}
          <Route exact path="/register" element={<Register />} />
          <Route exact path="/reset_password" element={<ResetPassword />} />
          <Route exact path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
