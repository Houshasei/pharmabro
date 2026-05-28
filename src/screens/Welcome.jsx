import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getCategoryCounts } from '../lib/quiz'
import { generateNickname } from '../lib/nicknames'

export default function Welcome() {
  const [name, setName] = useState('')
  const setPlayer = useStore((s) => s.setPlayer)
  const navigate = useNavigate()
  const counts = getCategoryCounts()

  const submit = () => {
    setPlayer(name.trim() || generateNickname())
    navigate('/menu')
  }
  const skip = () => {
    setPlayer(generateNickname())
    navigate('/menu')
  }

  return (
    <div className="app-container">
      <div className="welcome-screen">
        <div className="welcome-card">
          <h1 className="welcome-title gradient-text">PharmaBro</h1>
          <p className="welcome-subtitle">
            Pharmacy Board reviewer — SBE & CE, {counts.total} questions.
          </p>
          <input
            className="input-neon"
            placeholder="Your name (or skip)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
            maxLength={40}
            autoFocus
          />
          <div className="btn-row">
            <button className="btn btn-primary" onClick={submit}>
              {name.trim() ? `Let's go, ${name.trim()}` : 'Start'} →
            </button>
            <button className="btn btn-ghost" onClick={skip}>
              Skip
            </button>
          </div>
          <p style={{ marginTop: 22, fontSize: 13, color: 'var(--text-dim)' }}>
            Progress saves in your browser.
          </p>
        </div>
      </div>
    </div>
  )
}
