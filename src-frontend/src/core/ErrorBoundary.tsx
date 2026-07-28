import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside GPO component tree:", error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0E13] text-[#F8FAFC] p-6 font-sans">
          <div className="max-w-md w-full border border-[#EF4444] bg-[#151A21] p-6 rounded-[3px] shadow-[0px_2px_4px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-3 mb-4 text-[#EF4444]">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h1 className="font-heading text-lg font-bold tracking-[-0.02em] uppercase leading-none">
                  System Crash
                </h1>
                <p className="text-xs text-[#94A3B8] font-mono mt-1">[ERR.SYS-RENDER-FAIL]</p>
              </div>
            </div>

            <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">
              The interface encountered a fatal rendering error. Operational safety loops remain
              active at edge substation RTU perimeters.
            </p>

            {this.state.error && (
              <pre className="bg-[#1C222B] text-xs text-[#EF4444] p-3 rounded-[1px] font-mono overflow-auto max-h-[160px] border border-[#2A313C] mb-6">
                {this.state.error.toString()}
              </pre>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#EF4444] hover:bg-[#D32F2F] text-white font-heading font-medium uppercase text-xs tracking-[0.05em] py-2.5 rounded-[1px] transition-colors"
            >
              Restart Console
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
