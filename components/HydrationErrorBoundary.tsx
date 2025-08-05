import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasHydrationError: boolean;
  error?: Error;
}

class HydrationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasHydrationError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a hydration error
    const isHydrationError = error.message.includes('Hydration failed') ||
                            error.message.includes('Text content does not match') ||
                            error.message.includes('Expected server HTML') ||
                            error.message.includes('Minified React error #418') ||
                            error.message.includes('Minified React error #467');
    
    if (isHydrationError) {
      return { hasHydrationError: true, error };
    }
    
    // Re-throw non-hydration errors to be caught by parent error boundary
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log hydration errors for debugging
    console.warn('Hydration error caught:', error, errorInfo);
    
    // In production, we might want to report this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: reportHydrationError(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Reset the error state and force a re-render
    this.setState({ hasHydrationError: false, error: undefined });
    
    // Force a client-side re-render by reloading
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasHydrationError) {
      // Custom fallback UI for hydration errors
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default hydration error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-500" />
                <h2 className="mt-4 text-lg font-medium text-gray-900">
                  Sayfa Yükleme Sorunu
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Sayfa yüklenirken bir uyumsuzluk oluştu. Bu genellikle geçici bir sorundur.
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4 text-left">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      Teknik detaylar (geliştirici modu)
                    </summary>
                    <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-800 overflow-auto max-h-40">
                      <div className="font-semibold">Hydration Error:</div>
                      <div className="mb-2">{this.state.error.toString()}</div>
                    </div>
                  </details>
                )}
                
                <div className="mt-6">
                  <button
                    onClick={this.handleRetry}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Sayfayı Yenile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default HydrationErrorBoundary;