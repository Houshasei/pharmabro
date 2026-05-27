import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar'

export default function Credits() {
  return (
    <div className="app-container">
      <TopBar />
      <div className="credits-card">
        <div className="pill" style={{
          background: 'rgba(255, 0, 212, 0.12)',
          color: 'var(--neon-pink)',
          border: '1px solid rgba(255, 0, 212, 0.4)',
          margin: '0 auto'
        }}>
          Credits
        </div>
        <h2 style={{ marginTop: 16 }} className="gradient-text">PharmaBro</h2>
        <p className="by">For future RPh's.</p>
        <a
          href="https://t.me/qtkaybee"
          target="_blank"
          rel="noreferrer noopener"
          className="creator"
        >
          <div className="av">@</div>
          <div style={{ textAlign: 'left' }}>
            <div className="nm">@qtkaybee</div>
            <div className="hd">t.me/qtkaybee</div>
          </div>
        </a>
        <p style={{ marginTop: 28, fontSize: 13, color: 'var(--text-dim)' }}>
          975 questions · SBE & CE modules.
        </p>
        <div className="btn-row" style={{ marginTop: 18 }}>
          <Link to="/menu" className="btn btn-secondary">← Back to Menu</Link>
        </div>
      </div>
    </div>
  )
}
