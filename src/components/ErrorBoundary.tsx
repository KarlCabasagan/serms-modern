import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw, ShieldAlert } from 'lucide-react'

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SERMS Modern render error', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="fatal">
        <div className="fatal__card">
          <img src="./spc-logo.jpg" alt="" />
          <div className="fatal__eyebrow">SERMS Modern</div>
          <h1>Something went wrong.</h1>
          <p>
            The screen could not finish rendering. No database writes are made by this fallback.
          </p>
          <div className="fatal__detail">
            <ShieldAlert size={14} />
            <span>{this.state.error.message}</span>
          </div>
          <button className="btn btn--primary" onClick={() => window.location.reload()}>
            <RefreshCw size={14} />
            Reload the app
          </button>
        </div>
      </main>
    )
  }
}
