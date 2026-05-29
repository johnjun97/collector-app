import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

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
    <div>
      <h1>Forgot Password</h1>

      <input
        placeholder="Enter email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={handleReset}>
        Send reset email
      </button>
    </div>
  )
}