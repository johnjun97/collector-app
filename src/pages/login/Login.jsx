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

  const [loading, setLoading] = useState(false)


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

  const handleLogin = async (e) => {
    e.preventDefault() //stops the page from refreshing So React can handle login like call supabase, stay on same page, navigate manually

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    setLoading(false)

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
        <h1 className="login-title">Collector-App</h1>

        {/* <div className="form-content"> */}
        <form
          className={`form-content ${loading ? "loading" : ""}`}
          onSubmit={handleLogin}
        >

          {/* email */}
          <input
            className="field"
            disabled={loading}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* password */}
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              disabled={loading}
              name="password"
              autoComplete="current-password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              className="field"
            />

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
          type="submit" 
          disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

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

      </div >
    </div >
  )
}