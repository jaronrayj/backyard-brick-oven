import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useNavigate } from "react-router-dom";
import googleLogo from "../../assets/black-google-logo.png";
import {
  auth,
  registerWithEmailAndPassword,
  signInWithGoogle,
} from "../../utils/firebase";
import "./RegisterStyles.css";

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
    if (user) navigate("/");
  }, [user, loading, navigate]);
  return (
    <div className="register">
      <div className="register__container">
        <div className="m-auto justify-center flex">
          <div className="w-full max-w-xs">
            <form className="bg-white -md rounded-md px-8 pt-6 pb-8 mb-4">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-blue-200 bg-blue-300 rounded-md justify-center w-full mb-4 font-bold"
                onClick={signInWithGoogle}
              >
                {/* <img className="googleLogo" src={googleLogo} alt="google logo" /> */}
                Register with Google
              </button>
              <h5 className="mb-4">or</h5>
              <input
                className="mb-2.5 appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:-outline"
                type="text"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="mb-2.5 appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:-outline"
                type="password"
                value={password}
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <input
                className="mb-6 appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:-outline"
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {/* <p className="text-red-500 text-xs italic">
                  Please choose a password.
                </p> */}
              <button
                className=" px-4 py-2 text-gray-600 hover:bg-blue-200 bg-blue-300 rounded-md justify-center w-full font-bold"
                variant="dark"
                onClick={register}
              >
                Register
              </button>
            </form>
            <div>
              Already have an account?{" "}
              <Link className="text-blue-600 hover:text-blue-500" to="/login">
                Login here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Register;
