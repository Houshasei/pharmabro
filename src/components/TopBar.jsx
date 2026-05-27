import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function TopBar({ score, totalAnswered }) {
  const player = useAuth((s) => s.player)
  const logout = useAuth((s) => s.logout)
  const navigate = useNavigate()
  const initial = player?.name?.[0]?.toUpperCase() || '?'

  const handleLogout = async () => {
    if (!window.confirm('Sign out? Your progress is saved.')) return
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="top-bar">
      <div className="brand" onClick={() => navigate('/')}>
        <div className="brand-icon">⚡</div>
        <span className="gradient-text">PharmaBro</span>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {typeof score === 'number' && (
          <div className="score-chip">
            <span className="neon-text-pink">★</span>
            <span>{score}</span>
            {typeof totalAnswered === 'number' && (
              <span style={{ opacity: 0.6, fontWeight: 400 }}>/ {totalAnswered}</span>
            )}
          </div>
        )}
        {player && (
          <div className="player-chip">
            <div className="avatar">{initial}</div>
            <span>{player.name}</span>
          </div>
        )}
        <Link to="/search" className="btn btn-ghost" style={{ padding: '8px 14px' }}>🔎 Search</Link>
        <button
          className="btn btn-ghost"
          style={{ padding: '8px 14px' }}
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
        >
          ⏻
        </button>
      </div>
    </div>
  )
}
