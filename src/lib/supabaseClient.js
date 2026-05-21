import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)

const handleRegister = async () => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) {
    alert(error.message)
  } else {
    alert("Check your email to confirm account")
  }
}