import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function ProtectedRoute({ session, children }) {

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}