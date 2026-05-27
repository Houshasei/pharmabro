import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Log to console only — no remote sink in a static SPA.
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info)
  }

  reset = () => {
    this.setState({ error: null })
    // Hard reload so a corrupted store can be re-hydrated.
    window.location.hash = '#/'
    window.location.reload()
  }

  clearStorage = () => {
    try { localStorage.removeItem('pharmaquiz-state-v1') } catch {}
    this.reset()
  }

  render() {
    if (!this.state.error) return this.props.children
    const msg = this.state.error?.message || String(this.state.error)
    return (
      <div className="app-container">
        <div className="welcome-screen">
          <div className="welcome-card" style={{ borderColor: 'var(--neon-red)', boxShadow: '0 0 18px rgba(255,46,99,0.4)' }}>
            <h2 style={{ color: 'var(--neon-red)' }}>Something broke</h2>
            <p style={{ marginTop: 12, color: 'var(--text-dim)' }}>
              {msg}
            </p>
            <p style={{ marginTop: 14, fontSize: 13, color: 'var(--text-dim)' }}>
              Try reloading. If that doesn't help, clear saved progress.
            </p>
            <div className="btn-row" style={{ marginTop: 18 }}>
              <button className="btn btn-primary" onClick={this.reset}>Reload</button>
              <button className="btn btn-ghost" onClick={this.clearStorage}>Clear saved progress</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
