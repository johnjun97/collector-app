import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login/Login.jsx'
import Home from './pages/Home/home.jsx'
import Register from './pages/Register/register.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />

    </Routes>
  )
}

