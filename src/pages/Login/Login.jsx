import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import './Login.css'
import { FaEye, FaEyeSlash} from "react-icons/fa"


export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Login success')
    }
  }
  return (
    <div className="login-container">
      <div className="login-form">
        <h1>Login</h1>

        <div className="form-content">

          {/* email */}
          <input
            className="field"
            type="email"
            placeholder="email"
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* password */}
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="password"
              onChange={(e) => setPassword(e.target.value)}
              className="field"
            />

            {/* eye */}
            <span
              onClick={() => setShowPassword(prev => !prev)}
              className="eye-icon"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* buttons */}
          <button className="login-button">Login</button>

          {/* Forgot Password */}
          <div className="forgot-password">
            <button>
              Forgot Password
            </button>

            <p >
              Don't have an account?{" "}
              <span>
                Register
              </span>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}