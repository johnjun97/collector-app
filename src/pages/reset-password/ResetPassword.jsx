import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import './ResetPassword.css'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()

  const handleUpdatePassword = async () => {
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      alert(error.message)
      return
    }

    alert("Password updated successfully")
    await supabase.auth.signOut()
    navigate("/login")
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-form">

        <h1 className="reset-password-title">Reset Password</h1>

        <input className="reset-password-field"
          type="password"
          placeholder="New password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <input className="reset-password-field"
          type="password"
          placeholder="Confirm Password"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />


        <button className="update-button" onClick={handleUpdatePassword}>
          Update Password
        </button>
      </div>
    </div>
  )
}