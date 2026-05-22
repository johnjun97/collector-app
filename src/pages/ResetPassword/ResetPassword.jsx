import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
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
    <div>
      <h1>Reset Password</h1>

      <input
        type="password"
        placeholder="New password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleUpdatePassword}>
        Update Password
      </button>
    </div>
  )
}