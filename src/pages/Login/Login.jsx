import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { FaEye, FaEyeSlash } from "react-icons/fa"
import { useNavigate } from 'react-router-dom'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)


  // Check if user is already logged in || in recovery flow
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (data.user) {
        navigate("/home")
      }
    }

    checkUser()
  }, [])

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
    } else {
      // alert('Login success')
      navigate("/home")
    }
  }
  return (
    <div className="login-container">
      <div className="login-form">
        <h1 className="login-title">Login</h1>

        <div className="form-content">

          {/* email */}
          <input
            className="field"
            type="email"
            placeholder="email"
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* password */}
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="password"
              onChange={(e) => setPassword(e.target.value)}
              className="field"
            />

            {/* eye */}
            <span
              onClick={() => setShowPassword(prev => !prev)}
              className="eye-icon"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* buttons */}
          <button
            className="login-button"
            onClick={handleLogin}>
            Login
          </button>

          {/* Forgot Password */}
          <div className="forgot-password">
            <button onClick={() => navigate("/ForgotPassword")}>
              Forgot Password
            </button>

            <p >
              Don't have an account?{" "}
              <span onClick={() => navigate("/Register")}>
                Register
              </span>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}