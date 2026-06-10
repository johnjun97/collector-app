import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash } from "react-icons/fa"
import { supabase } from '../../lib/supabaseClient'
import './Register.css'

export default function Register() {
  const [email, setEmail] = useState('')
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    setLoading(true)

    if (password !== confirmPassword) {
      alert("Passwords do not match")
      setLoading(false)
      return
    }

    const fallbackName = email.split("@")[0]

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          displayName: displayName || fallbackName
        }
      }
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    alert("Check your email to confirm account")
    setLoading(false)
  }

  return (
    <div className="register-container">
      <div className={`form-content ${loading ? "loading" : ""}`}>
        <h1 className="register-title">Register</h1>

        <input
          placeholder="Email"
          disabled={loading}
          className="field"
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="password-field-container new-password-field">
          <input
            type={showPassword ? "text" : "password"}
            disabled={loading}
            className="field"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            onClick={() => setShowPassword(prev => !prev)}
            className="eye-icon"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="password-field-container confirm-password-field">
          <input
            type={showConfirmPassword ? "text" : "password"}
            disabled={loading}
            className="field"
            placeholder="Confirm Password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <span
            onClick={() => setShowConfirmPassword(prev => !prev)}
            className="eye-icon"
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <input
          placeholder="Display Name (optional)"
          disabled={loading}
          className="field"
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <button
          className="register-button"
          onClick={handleRegister}
          disabled={loading || !email || !password || !confirmPassword}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <button className="back-button" onClick={() => navigate("/login")} disabled={loading}>
          Back to Login
        </button>
      </div>
    </div>
  )
}