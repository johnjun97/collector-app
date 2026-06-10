import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './ForgotPassword.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)

  const handleReset = async () => {

    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email)

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      alert("Reset email sent, Please check your inbox or spam folder")
      navigate("/login")
    }
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-form">
        <h1 className="forgot-password-title">Forgot Password</h1>

        <div className={`form-content ${loading ? "loading" : ""}`}>
          <input className="field"
            disabled={loading}
            type="email"
            placeholder="Enter Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            className="reset-button"
            onClick={handleReset}
            disabled={loading}>
            {loading ? "Sending..." : "Send Reset Email"}
          </button>

          <button className="back-button"
            disabled={loading}
            onClick={() => navigate("/login")}>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}