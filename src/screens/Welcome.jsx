import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { getCategoryCounts } from '../lib/quiz'
import { generateNickname } from '../lib/nicknames'

function normalizeKeyForInput(s) {
  const up = s.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return up.slice(0, 16).match(/.{1,4}/g)?.join('-') || ''
}

export default function Welcome() {
  const [keyInput, setKey] = useState('')
  const [name, setName] = useState('')
  const auth = useAuth()
  const navigate = useNavigate()

  // If already signed in (rehydrated), skip ahead.
  useEffect(() => {
    if (auth.status === 'active' && auth.key) {
      navigate('/menu')
    }
  }, [auth.status, auth.key, navigate])

  const handleLogin = async () => {
    if (keyInput.replace(/[^A-Z0-9]/g, '').length !== 16) return
    const ok = await auth.login(keyInput)
    if (ok) {
      // Re-read state after login: refreshProgress() may have populated player.
      const cur = useAuth.getState()
      const finalName = name.trim() || cur.player?.name || generateNickname()
      if (!cur.player || (name.trim() && cur.player.name !== name.trim())) {
        auth.setPlayer(finalName)
      }
      navigate('/menu')
    }
  }

  const counts = getCategoryCounts()
  const status = auth.status

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
            placeholder="ACCESS KEY (e.g. ABCD-EFGH-JKLM-NPQR)"
            value={keyInput}
            onChange={(e) => setKey(normalizeKeyForInput(e.target.value))}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
            maxLength={19}
            autoFocus
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            style={{ letterSpacing: '0.12em', fontFamily: 'var(--heading)', fontSize: 16 }}
          />

          <input
            className="input-neon"
            style={{ marginTop: 10 }}
            placeholder="Your name (optional — random if blank)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
            maxLength={40}
          />

          <div className="btn-row">
            <button
              className="btn btn-primary"
              onClick={handleLogin}
              disabled={status === 'logging-in' || keyInput.replace(/[^A-Z0-9]/g, '').length !== 16}
            >
              {status === 'logging-in' ? 'Signing in…' : 'Start →'}
            </button>
          </div>

          {auth.lastError && (
            <div style={{
              marginTop: 14, padding: '10px 14px',
              background: 'rgba(255, 46, 99, 0.12)',
              border: '1px solid rgba(255, 46, 99, 0.5)',
              color: 'var(--neon-red)', borderRadius: 10, fontSize: 13,
              textAlign: 'left',
            }}>
              {auth.lastError}
            </div>
          )}

          <p style={{ marginTop: 22, fontSize: 13, color: 'var(--text-dim)' }}>
            Your access key syncs progress across devices. One device at a time.
          </p>
        </div>
      </div>
    </div>
  )
}
