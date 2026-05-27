import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { api } from './lib/api'
import { loadDataset } from './lib/quiz'
import ErrorBoundary from './components/ErrorBoundary'
import Welcome from './screens/Welcome'
import './App.css'

const Menu    = lazy(() => import('./screens/Menu'))
const Quiz    = lazy(() => import('./screens/Quiz'))
const Search  = lazy(() => import('./screens/Search'))
const Credits = lazy(() => import('./screens/Credits'))

const HEARTBEAT_INTERVAL_MS = 30_000

function RequireAuth({ children }) {
  const status = useAuth((s) => s.status)
  const key = useAuth((s) => s.key)
  if (!key || status !== 'active') return <Navigate to="/" replace />
  return children
}

function FullPageSpinner({ label = 'LOADING…' }) {
  return (
    <div className="app-container">
      <div className="welcome-screen">
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 32, height: 32, marginBottom: 16 }} />
          <div className="gradient-text" style={{
            fontFamily: 'var(--heading)', fontWeight: 700, letterSpacing: '0.18em',
          }}>
            {label}
          </div>
        </div>
      </div>
    </div>
  )
}

function DatasetGate({ children }) {
  const [ready, setReady] = useState(false)
  const [err, setErr] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    loadDataset()
      .then(() => { if (alive) setReady(true) })
      .catch((e) => { if (alive) setErr(e) })
    return () => { alive = false }
  }, [attempt])

  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (err) {
    return (
      <div className="app-container">
        <div className="welcome-screen">
          <div className="welcome-card" style={{ borderColor: 'var(--neon-red)' }}>
            <h2 style={{ color: 'var(--neon-red)' }}>Can't load questions</h2>
            <p style={{ marginTop: 12, color: 'var(--text-dim)', fontSize: 14 }}>{String(err.message || err)}</p>
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-dim)' }}>
              {online ? 'Check your connection and retry.' : 'You appear to be offline.'}
            </p>
            <div className="btn-row" style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => { setErr(null); setAttempt((a) => a + 1) }}>
                Retry ↻
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  if (!ready) return <FullPageSpinner />
  return (
    <>
      {children}
      {!online && (
        <div style={{
          position: 'fixed', bottom: 12, left: 12, right: 12, margin: '0 auto', maxWidth: 360,
          padding: '10px 14px', background: 'rgba(255,46,99,0.9)', color: '#fff',
          borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 600,
          zIndex: 1000, boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
        }}>
          You're offline — changes will sync when you're back.
        </div>
      )}
    </>
  )
}

function AuthBootstrap({ children }) {
  // On first mount, rehydrate the session against the server.
  const rehydrate = useAuth((s) => s.rehydrate)
  const status = useAuth((s) => s.status)
  const key = useAuth((s) => s.key)
  const token = useAuth((s) => s.token)
  const navigate = useNavigate()
  const didInit = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    rehydrate()
  }, [rehydrate])

  // Heartbeat loop — only while active.
  useEffect(() => {
    if (status !== 'active' || !key || !token) return
    let cancelled = false
    const ctrl = new AbortController()
    const tick = async () => {
      const res = await api.heartbeat(key, token, ctrl.signal).catch(() => null)
      if (!res) return
      if (!res.ok && res.status === 401 && !cancelled) {
        useAuth.setState({ status: 'expired', lastError: res.error || 'Session expired' })
      }
    }
    const id = setInterval(tick, HEARTBEAT_INTERVAL_MS)
    // Also send one immediately to confirm liveness.
    tick()
    return () => { cancelled = true; ctrl.abort(); clearInterval(id) }
  }, [status, key, token])

  // Best-effort logout when the tab closes.
  useEffect(() => {
    if (status !== 'active' || !key || !token) return
    const handler = () => {
      try {
        const blob = new Blob([JSON.stringify({ key, token })], { type: 'application/json' })
        navigator.sendBeacon?.('/api/auth/logout', blob)
      } catch {}
    }
    window.addEventListener('pagehide', handler)
    return () => window.removeEventListener('pagehide', handler)
  }, [status, key, token])

  // If the server reports session expired, navigate home with a message.
  useEffect(() => {
    if (status === 'expired') {
      // Clear local + go home
      useAuth.getState().logout()
      navigate('/', { replace: true })
    }
  }, [status, navigate])

  if (status === 'rehydrating') return <FullPageSpinner label="RECONNECTING…" />
  return children
}

export default function App() {
  return (
    <ErrorBoundary>
      <DatasetGate>
        <AuthBootstrap>
          <Suspense fallback={<FullPageSpinner />}>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/menu" element={<RequireAuth><Menu /></RequireAuth>} />
              <Route path="/quiz/:mode" element={<RequireAuth><Quiz /></RequireAuth>} />
              <Route path="/search" element={<RequireAuth><Search /></RequireAuth>} />
              <Route path="/credits" element={<RequireAuth><Credits /></RequireAuth>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthBootstrap>
      </DatasetGate>
    </ErrorBoundary>
  )
}
