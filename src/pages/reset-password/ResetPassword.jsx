import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { FaEye, FaEyeSlash } from "react-icons/fa"
import { useNavigate } from 'react-router-dom'
import './ResetPassword.css'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

        <div className="password-field-container new-password-field">

          <input className="reset-password-field"
            disabled={loading}
            type={showPassword ? "text" : "password"}
            placeholder="New password"
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
          <input className="reset-password-field"
            disabled={loading}
            type={showConfirmPassword ? "text" : "password"}
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

        <button className="update-button"
          disabled={loading || !password || !confirmPassword}
          onClick={handleUpdatePassword}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  )
}