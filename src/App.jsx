import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './lib/store'
import { loadDataset } from './lib/quiz'
import ErrorBoundary from './components/ErrorBoundary'
import Welcome from './screens/Welcome'
import './App.css'

const Menu    = lazy(() => import('./screens/Menu'))
const Quiz    = lazy(() => import('./screens/Quiz'))
const Search  = lazy(() => import('./screens/Search'))
const Credits = lazy(() => import('./screens/Credits'))

function RequirePlayer({ children }) {
  const player = useStore((s) => s.player)
  if (!player) return <Navigate to="/" replace />
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
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)

  useEffect(() => {
    let alive = true
    loadDataset()
      .then(() => { if (alive) setReady(true) })
      .catch((e) => { if (alive) setErr(e) })
    return () => { alive = false }
  }, [attempt])

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
          You're offline — saved progress still works.
        </div>
      )}
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <DatasetGate>
        <Suspense fallback={<FullPageSpinner />}>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/menu" element={<RequirePlayer><Menu /></RequirePlayer>} />
            <Route path="/quiz/:mode" element={<RequirePlayer><Quiz /></RequirePlayer>} />
            <Route path="/search" element={<RequirePlayer><Search /></RequirePlayer>} />
            <Route path="/credits" element={<RequirePlayer><Credits /></RequirePlayer>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </DatasetGate>
    </ErrorBoundary>
  )
}
