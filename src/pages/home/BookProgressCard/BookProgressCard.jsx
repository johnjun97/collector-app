import './BookProgressCard.css'
import { useNavigate } from 'react-router-dom'

export default function BookProgressCard({ owned, total }) {
  const navigate = useNavigate()

  const percentage = total
    ? (owned / total) * 100
    : 0

  return (
<div
  className="dashboard-card"
  onClick={() => navigate('/books')}
>

      <div className="dashboard-card-header">
        <div>
          <h2>所有书籍</h2>

          <span>
            {owned} / {total} (
            {Math.round(percentage)}
            %)
          </span>
        </div>
      </div>

      <div className="progress-container">
        <div
          className="progress-bar progress-animate"
          style={{
            width: `${percentage}%`
          }}
        />
      </div>

    </div>
  )
}