import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useNavigate } from "react-router-dom";
import googleLogo from "../../assets/black-google-logo.png";
import {
  auth,
  registerWithEmailAndPassword,
  signInWithGoogle,
} from "../../utils/firebase";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import "./Register.css";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [user, loading, error] = useAuthState(auth);
  const navigate = useNavigate();
  const register = () => {
    if (!name) alert("Please enter name");
    // TODO better error messaging if user account already exists
    registerWithEmailAndPassword(name, email, password);
  };
  useEffect(() => {
    if (loading) return;
    if (user) navigate("/dashboard");
  }, [user, loading, navigate]);
  return (
    <div className="register">
      <div className="register__container">
        <Form>
          <Form.Control
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
          />
          <Form.Control
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
          />
          <Form.Control
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <Button className="fullWidth" variant="dark" onClick={register}>
            Register
          </Button>
          <h4>or</h4>
          <Button className="fullWidth" onClick={signInWithGoogle}>
            {/* <img className="googleLogo" src={googleLogo} alt="google logo" /> */}
            Register with Google
          </Button>
        </Form>
        <div>
          Already have an account? <Link to="/login">Login</Link> now.
        </div>
      </div>
    </div>
  );
};
export default Register;
