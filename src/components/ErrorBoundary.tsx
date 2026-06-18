import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg)] p-6">
          <p className="text-3xl">⚠️</p>
          <h1 className="text-[18px] font-bold text-white">Something went wrong</h1>
          <p className="max-w-sm text-center text-sm text-[var(--color-text-muted)]">
            {this.state.error.message}
          </p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
            className="mt-2 h-12 rounded-xl bg-[var(--color-accent)] px-6 text-[15px] font-semibold text-white"
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
