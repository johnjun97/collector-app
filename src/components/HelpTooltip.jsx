import { useEffect, useState } from 'react'
import './HelpTooltip.css'

export default function HelpTooltip({ children }) {
    const [showTooltip, setShowTooltip] = useState(false)

    const handlePointerUp = (e) => {
        e.preventDefault()
        e.stopPropagation()

        setShowTooltip((prev) => !prev)
    }

    useEffect(() => {
        if (!showTooltip) return

        const isMobile = window.matchMedia(
            '(max-width: 600px)'
        ).matches

        if (!isMobile) return

        const timer = setTimeout(() => {
            setShowTooltip(false)
        }, 5000)

        return () => clearTimeout(timer)
    }, [showTooltip])

    return (
        <>
            <span className="help-tooltip">
                <button
                    type="button"
                    className="help-tooltip-icon"
                    onPointerUp={handlePointerUp}
                >
                    ?
                </button>
            </span>

            {showTooltip && (
                <div
                    style={{
                        position: 'fixed',
                        left: '12px',
                        right: '12px',
                        bottom: '12px',
                        padding: '15px',
                        background: '#333',
                        color: '#fff',
zIndex: 2147483647,
                        borderRadius: '8px',
                    }}
                >
                    {children}
                </div>
            )}
        </>
    )
}