import { useEffect, useState } from 'react'
import './HelpTooltip.css'

export default function HelpTooltip({ children }) {
    const [showTooltip, setShowTooltip] = useState(false)

    const handlePointerUp = (e) => {
        e.preventDefault()
        e.stopPropagation()

        console.log('TOOLTIP CLICK')

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
        <span className="help-tooltip">
            <button
                type="button"
                className="help-tooltip-icon"
                onPointerUp={handlePointerUp}
            >
                ?
            </button>

            {showTooltip && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        left: '20px',
                        right: '20px',
                        background: 'red',
                        color: 'white',
                        padding: '20px',
                        zIndex: 999999,
                    }}
                >
                    TEST TOOLTIP
                </div>
            )}
        </span>
    )
}