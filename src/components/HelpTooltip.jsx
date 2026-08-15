import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import './HelpTooltip.css'

export default function HelpTooltip({ children }) {
    const [showTooltip, setShowTooltip] = useState(false)
    const [tooltipPosition, setTooltipPosition] = useState({})

    const buttonRef = useRef(null)

    const handlePointerUp = (e) => {
        e.preventDefault()
        e.stopPropagation()

        setShowTooltip((prev) => !prev)
    }

    useEffect(() => {
        if (!showTooltip) return

        const updatePosition = () => {
            const button = buttonRef.current

            if (!button) return

            const rect = button.getBoundingClientRect()

            const tooltipWidth = 260
            const gap = 8
            const margin = 12
            const estimatedHeight = 100

            let left = rect.left
            let top = rect.bottom + gap

            // Keep inside left/right edges
            if (left + tooltipWidth > window.innerWidth - margin) {
                left = window.innerWidth - tooltipWidth - margin
            }

            if (left < margin) {
                left = margin
            }

            // If there isn't enough space below, show above
            if (
                top + estimatedHeight >
                window.innerHeight - margin
            ) {
                top = rect.top - estimatedHeight - gap
            }

            if (top < margin) {
                top = margin
            }

            setTooltipPosition({
                left,
                top,
            })
        }

        updatePosition()

        window.addEventListener('resize', updatePosition)
        window.addEventListener('scroll', updatePosition)

        return () => {
            window.removeEventListener('resize', updatePosition)
            window.removeEventListener('scroll', updatePosition)
        }
    }, [showTooltip])

    useEffect(() => {
        if (!showTooltip) return

        const timer = setTimeout(() => {
            setShowTooltip(false)
        }, 5000)

        return () => clearTimeout(timer)
    }, [showTooltip])

    return (
        <>
            <span className="help-tooltip">
                <button
                    ref={buttonRef}
                    type="button"
                    className="help-tooltip-icon"
                    onPointerUp={handlePointerUp}
                >
                    ?
                </button>
            </span>

            {showTooltip &&
                createPortal(
                    <div
                        className="help-tooltip-content"
                        style={tooltipPosition}
                    >
                        {children}
                    </div>,
                    document.body
                )}
        </>
    )
}