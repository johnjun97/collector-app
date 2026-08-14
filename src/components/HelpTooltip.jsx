import { useState } from 'react'
import './HelpTooltip.css'

export default function HelpTooltip({ children }) {
    const [showTooltip, setShowTooltip] = useState(false)

    return (
        <span className="help-tooltip">
            <button
                type="button"
                className="help-tooltip-icon"
                onClick={() => setShowTooltip((prev) => !prev)}
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