import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { FaEye, FaEyeSlash } from "react-icons/fa"
import { useNavigate } from 'react-router-dom'
import './Login.css'
import Loading from '../../components/Loading'

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)

  const recordDailyLogin = async () => {
    const { error } =
      await supabase.rpc('record_daily_login')

    if (error) {
      console.error(
        'Failed to record daily login:',
        error
      )
    }
  }

  // Check if user is already logged in || in recovery flow
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (data.user) {
        await recordDailyLogin()
        navigate("/home")
      }
    }

    checkUser()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setLoading(false)
      alert(error.message)
      return
    }

    await recordDailyLogin()

    setLoading(false)

    navigate("/home")
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h1 className="login-title">Collector-App</h1>

        {loading ? (
          <Loading text="Logging in" />
        ) : (
          <form
            className="form-content"
            onSubmit={handleLogin}
          >

            {/* email */}
            <input
              className="field"
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

            <button
              className="login-button"
              type="submit"
            >
              Login
            </button>

          </form>
        )}

        {/* Forgot Password */}
        <div className="forgot-password">
          <button onClick={() => navigate("/ForgotPassword")}>
            Forgot Password
          </button>

          <p>
            Don't have an account?{" "}
            <span onClick={() => navigate("/Register")}>
              Register
            </span>
          </p>
        </div>

      </div>
    </div>
  )
}