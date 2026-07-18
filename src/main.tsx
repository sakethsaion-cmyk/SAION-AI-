import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// ── Global error boundary — catches any crash and shows error instead of blank screen
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message || String(error) }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[SAION AI] Crash:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#000', color: '#fff', height: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'sans-serif', padding: '24px', textAlign: 'center'
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: '#1a0033', border: '2px solid #7c3aed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, marginBottom: 20
          }}>⚡</div>
          <h2 style={{ color: '#a78bfa', fontSize: 20, marginBottom: 8 }}>
            SAION AI
          </h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
            Something went wrong. Please restart the app.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#7c3aed', color: '#fff', border: 'none',
              padding: '12px 28px', borderRadius: 12, fontSize: 14,
              cursor: 'pointer', fontWeight: 600
            }}
          >
            Restart App
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{
              marginTop: 16, color: '#ef4444', fontSize: 11,
              maxWidth: 300, overflow: 'auto', textAlign: 'left'
            }}>
              {this.state.error}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

// ── Mount React ───────────────────────────────────────────────────────────────
const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML = '<div style="color:white;background:black;height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif">SAION AI failed to start. Please reinstall.</div>'
} else {
  ReactDOM.createRoot(rootEl).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
}
