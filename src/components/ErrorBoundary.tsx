// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 rounded-xl border border-red-200">
          <h3 className="text-red-800 font-medium">Something went wrong</h3>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-2 text-sm text-red-600">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}