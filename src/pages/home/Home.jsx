import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Navbar from '../../components/Navbar'

export default function Home() {

  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    getUser()
  }, [])

  return (
    <>
      <Navbar />

      <div style={{ padding: "20px" }}>
        <h1>Home Page</h1>
        <p>Welcome, {user?.user_metadata?.displayName || user?.email}</p>
      </div>
    </>
  )
}