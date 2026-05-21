import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  const handleRegister = async () => {

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
    <div>
    <h1>Register</h1>
     <input
        placeholder="email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        placeholder="Display Name"
        onChange={(e) => setDisplayName(e.target.value)}
      />

      <button onClick={handleRegister}>
        Register
      </button>
    </div>
  )
}