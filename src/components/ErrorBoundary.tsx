import { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
          <div className="text-center p-8 max-w-md">
            <h1 className="text-2xl font-bold text-slate-700 mb-4">
              Something went wrong
            </h1>
            <p className="text-slate-500 mb-6">
              We encountered an error while loading your todos. Try refreshing
              the page.
            </p>
            <button
              className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
