import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Navbar.css'

export default function Navbar() {
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)

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

                <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    <button onClick={() => {
                        navigate('/home')
                        setMenuOpen(false)
                    }}>
                        Home
                    </button>

                    <button onClick={() => {
                        navigate('/books')
                        setMenuOpen(false)
                    }}>
                        Books
                    </button>

                    <button onClick={() => {
                        navigate('/musics')
                        setMenuOpen(false)
                    }}>
                        Music
                    </button>

                    <button onClick={() => {
                        navigate('/video')
                        setMenuOpen(false)
                    }}>
                        Video
                    </button>

                    <button onClick={() => {
                        navigate('/figures')
                        setMenuOpen(false)
                    }}>
                        Figures
                    </button>

                    <button onClick={() => {
                        navigate('/games')
                        setMenuOpen(false)
                    }}>
                        Games
                    </button>

                    <button
                        className="mobile-logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </div>

            <button
                className="menu-toggle"
                onClick={() => setMenuOpen(!menuOpen)}
            >
                {menuOpen ? '✕' : '☰'}
            </button>

            <button
                className="navbar-logout desktop-logout"
                onClick={handleLogout}
            >
                Logout
            </button>
        </nav>
    )

}