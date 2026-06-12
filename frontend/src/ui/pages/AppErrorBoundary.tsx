import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import i18n from '@/i18n'
import ErrorPage from './ErrorPage.tsx'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Top-level boundary: catches any uncaught render error and shows a shadcn
 * error page instead of a blank white screen. Complements the WebGL boundary,
 * which only wraps the 3D scene.
 */
export class AppErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false }

  public static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error boundary caught an error:', error, info)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          icon={AlertTriangle}
          code="500"
          title={i18n.t('errors.crashTitle')}
          description={i18n.t('errors.unexpected')}
          actionLabel={i18n.t('common.refreshPage')}
          actionIcon={RefreshCw}
          onAction={() => window.location.reload()}
        />
      )
    }
    return this.props.children
  }
}
