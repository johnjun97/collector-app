import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Navbar.css'

export default function Navbar({ section = '收藏' }) {
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
                    {section}
                </div>

                <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    <button onClick={() => {
                        navigate('/home')
                        setMenuOpen(false)
                    }}>
                        首页
                    </button>

                    <button onClick={() => {
                        navigate('/books')
                        setMenuOpen(false)
                    }}>
                        书籍
                    </button>

                    <button onClick={() => {
                        navigate('/musics')
                        setMenuOpen(false)
                    }}>
                        音乐
                    </button>

                    <button onClick={() => {
                        navigate('/video')
                        setMenuOpen(false)
                    }}>
                        影音
                    </button>

                    <button onClick={() => {
                        navigate('/games')
                        setMenuOpen(false)
                    }}>
                        游戏
                    </button>

                    <button onClick={() => {
                        navigate('/figures')
                        setMenuOpen(false)
                    }}>
                        模型
                    </button>

                    <button
                        className="mobile-logout"
                        onClick={handleLogout}
                    >
                        登出
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
                登出
            </button>
        </nav>
    )
}