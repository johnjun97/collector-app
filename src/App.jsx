import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login/Login.jsx'
import Home from './pages/home/Home.jsx'
import Register from './pages/register/Register.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import ForgotPassword from './pages/forgot-password/ForgotPassword.jsx'
import ResetPassword from './pages/reset-password/ResetPassword.jsx'
import { supabase } from './lib/supabaseClient'
import { useAuthListener } from './auth/useAuthListener'
import Books from './pages/books/Books.jsx'
import NewBook from './pages/books/NewBook/NewBook.jsx'
import EditBook from './pages/books/EditBook/EditBook.jsx'
import ComingSoon from './pages/coming-soon/ComingSoon.jsx'

export default function App() {

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
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)

      if (event === "PASSWORD_RECOVERY") {
        window.location.href = "/resetPassword"
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/Register" element={<Register />} />
      <Route path="/forgotPassword" element={<ForgotPassword />} />
      <Route path="/resetPassword" element={<ResetPassword />} />

      <Route path="/home" element={<ProtectedRoute session={session}><Home /></ProtectedRoute>} />
      <Route path="/books" element={<ProtectedRoute session={session}><Books /></ProtectedRoute>} />
      <Route path="/books/new" element={<ProtectedRoute session={session}><NewBook /></ProtectedRoute>} />
      <Route path="/books/:id/edit" element={<ProtectedRoute session={session}><EditBook /></ProtectedRoute>} />

      <Route path="/musics" element={<ProtectedRoute session={session}><ComingSoon /></ProtectedRoute>} />
      <Route path="/video" element={<ProtectedRoute session={session}><ComingSoon /></ProtectedRoute>} />
      <Route path="/games" element={<ProtectedRoute session={session}><ComingSoon /></ProtectedRoute>} />
      <Route path="/models" element={<ProtectedRoute session={session}><ComingSoon /></ProtectedRoute>} />
    </Routes>
  )
    
}

