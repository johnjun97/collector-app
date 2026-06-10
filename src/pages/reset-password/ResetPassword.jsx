import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import './ResetPassword.css'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)

  const handleUpdatePassword = async () => {

    if (password !== confirmPassword) {
      alert("Passwords do not match")
      setLoading(false)
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    alert("Password updated successfully")
    setLoading(false)
    await supabase.auth.signOut()
    navigate("/login")
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-form">

        <h1 className="reset-password-title">Reset Password</h1>

        <input className="reset-password-field"
          disabled={loading}
          type="password"
          placeholder="New password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <input className="reset-password-field"
          disabled={loading}
          type="password"
          placeholder="Confirm Password"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button className="update-button"
          disabled={loading || !password || !confirmPassword}
          onClick={handleUpdatePassword}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  )
}