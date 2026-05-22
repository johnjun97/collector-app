import { useEffect } from 'react'
import { useNavigate, Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import Login from './pages/Login/Login.jsx'
import Home from './pages/Home/Home.jsx'
import Register from './pages/Register/register.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword/ResetPassword.jsx'

export default function App() {
  const navigate = useNavigate()

  useEffect(() => {
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event) => {

        if (event === "PASSWORD_RECOVERY") {
          navigate("/ResetPassword")
        }
      })

    return () => subscription.unsubscribe()
  }, [navigate])

  // useEffect(() => {
  //   const { data: { subscription } } =
  //     supabase.auth.onAuthStateChange((event) => {

  //       if (
  //         event === "PASSWORD_RECOVERY" ||
  //         window.location.hash.includes("type=recovery")
  //       ) {
  //         navigate("/ResetPassword")
  //       }
  //     })

  //   return () => subscription.unsubscribe()
  // }, [navigate])

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/ForgotPassword" element={<ForgotPassword />} />
      <Route path="/ResetPassword" element={<ResetPassword />} />
    </Routes>
  )
}

