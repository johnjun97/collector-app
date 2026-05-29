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

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match")
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
      return
    }

    alert("Check your email to confirm account")
  }

  return (
    <div className="register-container">
      <div className="form-content">
        <h1 className="register-title">Register</h1>

        <input
          placeholder="Email"
          className="field"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="field"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          className="field"
          placeholder="Confirm Password"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <input
          placeholder="Display Name (optional)"
          className="field"
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <button className="register-button" onClick={handleRegister}>
          Register
        </button>

        <button className="back-button" onClick={() => navigate("/login")}>
          Back to Login
        </button>
      </div>
    </div>
  )
}