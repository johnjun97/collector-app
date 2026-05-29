import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './ForgotPassword.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  const handleReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      alert(error.message)
    } else {
      alert("Reset email sent")
      navigate("/login")
    }
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-form">
        <h1 className="forgot-password-title">Forgot Password</h1>

        <div className="form-content">
          <input className="field"
            placeholder="Enter Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="reset-button" onClick={handleReset}>
            Send Reset Email
          </button>

          <button className="back-button" onClick={() => navigate("/login")}>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}