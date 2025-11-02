'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Algo salió mal
              </h2>
              <p className="text-gray-600 mb-6">
                Por favor, recarga la página o intenta de nuevo más tarde.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] transition-colors"
              >
                Recargar página
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
