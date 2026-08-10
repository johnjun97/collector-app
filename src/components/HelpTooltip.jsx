import './HelpTooltip.css'

export default function HelpTooltip({ children }) {
    const handleClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
    }

    return (
        <span
            className="help-tooltip"
            onClick={handleClick}
            onTouchStart={handleClick}
        >
            <span className="help-tooltip-icon">
                ?
            </span>

            <span className="help-tooltip-content">
                {children}
            </span>
        </span>
    )
}