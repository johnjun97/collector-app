import './ContributionCard.css'

export default function ContributionCard({ stats }) {
    return (
        <div className="contribution-card">

            <div className="contribution-card-header">
                <div>
                    <h2>Contributions: <span>{stats.total}</span></h2>
                </div>
            </div>

            <div className="contribution-stats">
                <div className="contribution-stat">
                    <span className="contribution-stat-value">
                        {stats.created}
                    </span>
                    <span className="contribution-stat-label">
                        Created
                    </span>
                </div>

                <div className="contribution-stat">
                    <span className="contribution-stat-value">
                        {stats.updated}
                    </span>
                    <span className="contribution-stat-label">
                        Updated
                    </span>
                </div>

                <div className="contribution-stat">
                    <span className="contribution-stat-value">
                        {stats.deleted}
                    </span>
                    <span className="contribution-stat-label">
                        Deleted
                    </span>
                </div>
            </div>

        </div>
    )
}