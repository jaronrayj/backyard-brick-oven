import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { auth, sendPasswordReset } from "../../utils/firebase";
import "./ResetPassword.css";
import Button from "react-bootstrap/Button";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [user, loading, error] = useAuthState(auth);
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (user) navigate("/dashboard");
  }, [user, loading, navigate]);
  return (
    <div className="reset">
      <div className="reset__container">
        {/* TODO set up as a form */}
        {/* TODO have better error messaging */}
        <input
          type="text"
          className="reset__textBox"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail Address"
        />
        <Button
          className="fullWidth"
          variant="dark"
          type="submit"
          onClick={() => sendPasswordReset(email)}
        >
          Send password reset email
        </Button>
        <div>
          Don't have an account? <Link to="/register">Register</Link> now.
        </div>
      </div>
    </div>
  );
};
export default ResetPassword;
