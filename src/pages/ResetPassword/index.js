import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { auth, sendPasswordReset } from "../../utils/firebase_auth";
import "./ResetPassword.css";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [user, loading, error] = useAuthState(auth);
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (user) navigate("/");
  }, [user, loading, navigate]);
  return (
    <div className="reset">
      <div className="reset__container">
        <div className="m-auto justify-center flex">
          <div className="w-full max-w-xs">
            <div className="bg-white -md rounded-md px-8 pt-6 pb-8 mb-4">
              {/* TODO have better error messaging */}
              <input
                type="text"
                className="mb-2.5 appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:-outline"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
              />
              <button
                className="px-4 py-2 text-gray-600 hover:bg-blue-200 bg-blue-300 rounded-md justify-center w-full font-bold"
                variant="dark"
                type="submit"
                onClick={() => sendPasswordReset(email)}
              >
                Send password reset email
              </button>
            </div>
            <div>
              Don't have an account?{" "}
              <Link
                className="text-blue-600 hover:text-blue-500"
                to="/register"
              >
                Register here
              </Link>{" "}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ResetPassword;
