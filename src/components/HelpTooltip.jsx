import { useEffect, useState } from 'react'
import './HelpTooltip.css'

export default function HelpTooltip({ children }) {
    const [showTooltip, setShowTooltip] = useState(false)

    const handleClick = () => {
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
                onClick={handleClick}
            >
                ?
            </button>

            {showTooltip && (
                <span className="help-tooltip-content">
                    {children}
                </span>
            )}
        </span>
    )
}