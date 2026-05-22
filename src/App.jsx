import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login/Login.jsx'
import Home from './pages/Home/home.jsx'
import Register from './pages/Register/register.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword/ResetPassword.jsx'
import { useAuthListener } from './auth/useAuthListener'

export default function App() {
  useAuthListener()
  
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/Register" element={<Register />} />
      <Route path="/Home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/ForgotPassword" element={<ForgotPassword />} />
      <Route path="/ResetPassword" element={<ResetPassword />} />
    </Routes>
  )
}

