import { useState } from 'react'
import './HelpTooltip.css'

export default function HelpTooltip({ children }) {
    const [showTooltip, setShowTooltip] = useState(false)

    const handleClick = (e) => {
        e.preventDefault()
        e.stopPropagation()

        setShowTooltip((prev) => !prev)
    }

    return (
        <span className="help-tooltip">
            <button
                type="button"
                className="help-tooltip-icon"
                onClick={handleClick}
                onTouchEnd={handleClick}
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