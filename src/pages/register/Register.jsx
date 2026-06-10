import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './Register.css'

export default function Register() {
  const [email, setEmail] = useState('')
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

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

        <input
          type="password"
          disabled={loading}
          className="field"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          disabled={loading}
          className="field"
          placeholder="Confirm Password"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

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