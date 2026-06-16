import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/ui/shadcn/button.tsx'
import i18n from '@/i18n'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class WebGLErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WebGL Error Boundary caught an error:', error, errorInfo)
  }

  private handleRefresh = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-50 p-6 text-center select-none animate-in fade-in duration-300">
          <div className="max-w-md w-full p-6 rounded-2xl border border-border/80 bg-card shadow-2xl flex flex-col items-center space-y-5">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center text-destructive animate-bounce">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">{i18n.t('errors.webglContextLost')}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {i18n.t('errors.webglDescription')}
              </p>
            </div>

            <Button
              onClick={this.handleRefresh}
              className="w-full h-11 font-medium gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              {i18n.t('common.refreshPage')}
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
