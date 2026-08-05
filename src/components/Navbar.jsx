import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Navbar.css'

export default function Navbar() {
    const navigate = useNavigate()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <div className="navbar-brand">
                    Collector
                </div>

                <div className="navbar-links">
                    <button onClick={() => navigate('/home')}>
                        Home
                    </button>

                    <button onClick={() => navigate('/books')}>
                        Books
                    </button>

                    <button onClick={() => navigate('/musics')}>
                        Music
                    </button>

                    <button onClick={() => navigate('/video')}>
                        Video
                    </button>

                    <button onClick={() => navigate('/figures')}>
                        Figures
                    </button>

                    <button onClick={() => navigate('/games')}>
                        Games
                    </button>
                </div>
            </div>

            <button
                className="navbar-logout"
                onClick={handleLogout}
            >
                Logout
            </button>
        </nav>
    )

}