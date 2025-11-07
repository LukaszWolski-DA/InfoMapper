'use client'

import { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error to console (in production, send to error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Optional: Send to error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo })

    this.setState({
      errorInfo: errorInfo?.componentStack || 'No additional info',
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <h2 className="text-xl font-semibold">Something went wrong</h2>
            </div>

            <div className="space-y-2">
              <p className="text-gray-600">
                The application encountered an unexpected error. You can try to continue or reload the page.
              </p>

              {this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Technical details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono overflow-auto max-h-40">
                    <p className="text-red-600 font-semibold">{this.state.error.name}</p>
                    <p className="text-gray-700">{this.state.error.message}</p>
                    {this.state.errorInfo && (
                      <pre className="mt-2 text-gray-600 whitespace-pre-wrap">
                        {this.state.errorInfo}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={this.handleReset} variant="outline" className="flex-1">
                Try Again
              </Button>
              <Button onClick={this.handleReload} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
