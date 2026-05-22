import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export function useAuthListener() {
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
}