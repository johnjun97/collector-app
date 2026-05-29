import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login/Login.jsx'
import Home from './pages/home/home.jsx'
import Register from './pages/register/Register.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import ForgotPassword from './pages/forgot-password/ForgotPassword.jsx'
import ResetPassword from './pages/reset-password/ResetPassword.jsx'
import { supabase } from './lib/supabaseClient'
import { useAuthListener } from './auth/useAuthListener'

export default function App() {
  useAuthListener()

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setLoading(false)
    }

    getSession()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/Register" element={<Register />} />
      <Route path="/home" element={<ProtectedRoute session={session}><Home /></ProtectedRoute>} />
      <Route path="/ForgotPassword" element={<ForgotPassword />} />
      <Route path="/ResetPassword" element={<ResetPassword />} />
    </Routes>
  )
}

