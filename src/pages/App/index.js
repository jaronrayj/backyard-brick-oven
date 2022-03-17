import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
// import brickyard from "../assets/PXL_20220308_064811105.MP.jpg";

import Login from "../Login";
import Placeholder from "../Placeholder";
import Register from "../Register";
import ResetPassword from "../ResetPassword";
import Dashboard from "../Dashboard";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route exact path="/" element={<Placeholder />} />
          <Route exact path="/login" element={<Login />} />
          <Route exact path="/register" element={<Register />} />
          <Route exact path="/reset_password" element={<ResetPassword />} />
          <Route exact path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
