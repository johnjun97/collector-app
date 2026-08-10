import './HelpTooltip.css'

export default function HelpTooltip({ children }) {
    return (
        <span className="help-tooltip">
            <span className="help-tooltip-icon">!</span>

            <span className="help-tooltip-content">
                {children}
            </span>
        </span>
    )
}