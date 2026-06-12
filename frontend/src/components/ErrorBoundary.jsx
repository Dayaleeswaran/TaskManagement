import { Component } from 'react';
import { ShieldAlert, RefreshCw, Home, ChevronRight, ChevronDown } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details to services like Sentry, Datadog or browser console
    console.error('ErrorBoundary caught an uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[500px] flex items-center justify-center p-6">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-8 max-w-xl w-full shadow-2xl backdrop-blur-md relative overflow-hidden text-center">
            {/* Top glowing accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-600 via-rose-600 to-red-600"></div>

            <div className="mx-auto h-16 w-16 rounded-2xl bg-red-950/30 border border-red-500/20 flex items-center justify-center mb-6 text-red-400 shadow-lg shadow-red-500/5">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">Something Went Wrong</h1>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              An unexpected error occurred in the frontend application shell. We have logged this error and are working on fixing it.
            </p>

            {/* Error Message Box */}
            <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800/80 text-left">
              <p className="text-sm font-semibold text-rose-300 font-mono break-all">
                {this.state.error?.toString() || 'Unknown Error'}
              </p>
            </div>

            {/* Collapsible stack trace details */}
            {this.state.errorInfo && (
              <div className="mt-4 text-left">
                <button
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {this.state.showDetails ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                  <span>{this.state.showDetails ? 'Hide details' : 'Show details'}</span>
                </button>
                
                {this.state.showDetails && (
                  <pre className="mt-2 p-3 text-[11px] font-mono leading-4 bg-slate-900/50 border border-slate-800/50 text-slate-400 rounded-lg overflow-x-auto max-h-[150px] whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload Page</span>
              </button>
              
              <a
                href="/dashboard"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold flex items-center justify-center space-x-2 transition-all duration-200"
              >
                <Home className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
