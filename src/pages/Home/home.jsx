import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    getUser()
  }, [])

  return (
    <div style={{ padding: "20px" }}>
      <h1>Home Page</h1>
      <p>Welcome, {user ? user.email : "Guest"}</p>
      {/* <p>Hi {user}, Welcome to my app</p> */}

      <button
        onClick={async () => {
          await supabase.auth.signOut()
          setUser(null)
          navigate("/login")
        }}
      >
        Logout
      </button>
    </div>
  )
}