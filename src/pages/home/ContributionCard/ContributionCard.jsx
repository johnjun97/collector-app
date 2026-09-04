import './ContributionCard.css'

export default function ContributionCard({ stats, levelInfo }) {
    return (
        <div className="contribution-card">

            <div className="contribution-card-header">
                <div>
                    <h2>Level {levelInfo.level}</h2>

                    <span>
                        {levelInfo.nextLevelPoints - stats.total} EXP to next level  ({levelInfo.progress}%)
                    </span>
                </div>
            </div>

            <div className="contribution-progress">
                <div className="contribution-progress-bar">
                    <div
                        className="contribution-progress-fill"
                        style={{
                            width: `${levelInfo.progress}%`
                        }}
                    />
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