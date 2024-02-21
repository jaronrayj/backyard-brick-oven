import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  auth,
  logInWithEmailAndPassword,
  signInWithGoogle,
} from '../../utils/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
// import googleLogo from "../../assets/black-google-logo.png";
import './LoginStyles.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, loading, error] = useAuthState(auth)
  const navigate = useNavigate()
  // how we're tracking if they are logged in with a user account
  useEffect(() => {
    if (loading) {
      // maybe trigger a loading screen
      return
    }
    if (user) navigate('/')
  }, [user, loading, navigate])
  return (
    <div className="login">
      <div className="login__container">
        <div className="m-auto justify-center flex">
          <div className="w-full max-w-xs">
            <div className="bg-white -md rounded-md px-8 pt-6 pb-8 mb-4">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-blue-200 bg-blue-300 rounded-md justify-center w-full mb-4 font-bold"
                onClick={signInWithGoogle}
              >
                Login with Google
              </button>
              <h5 className="mb-4">or</h5>
              <input
                type="text"
                className="mb-2.5 appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:-outline"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
              />
              <input
                type="password"
                className="mb-2.5 appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:-outline"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
              <button
                className="mb-2 px-4 py-2 text-gray-600 hover:bg-blue-200 bg-blue-300 rounded-md justify-center w-full font-bold"
                onClick={() => logInWithEmailAndPassword(email, password)}
              >
                Login
              </button>
            </div>
            <div>
              <Link
                className="text-blue-600 hover:text-blue-500"
                to="/reset_password"
              >
                Forgot Password?
              </Link>
            </div>
            Don't have an account?{' '}
            <Link className="text-blue-600 hover:text-blue-500" to="/register">
              Register here
            </Link>{' '}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
