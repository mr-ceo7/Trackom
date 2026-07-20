import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);

    // Check if this is a dynamic import / chunk loading error
    const isChunkError =
      error.message && (
        error.message.includes('Failed to fetch dynamically imported module') ||
        error.message.includes('error loading dynamically imported module') ||
        error.message.includes('ChunkLoadError')
      );

    if (isChunkError) {
      const hasReloaded = sessionStorage.getItem('chunk-load-reloaded');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk-load-reloaded', 'true');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F3F4FD] dark:bg-surface-dark p-6">
          <div className="text-center space-y-6 max-w-md">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              An unexpected error occurred. Please try reloading the page.
            </p>
            {this.state.error && (
              <pre className="text-xs text-left p-4 rounded-xl bg-slate-100 dark:bg-white/5 text-red-600 dark:text-red-400 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover transition-all shadow-lg shadow-brand-primary/20 cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
