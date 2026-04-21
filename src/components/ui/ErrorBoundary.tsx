"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production, send to Sentry or logging service
    if (process.env.NODE_ENV === "production") {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-8 text-center">
          <span className="material-symbols-outlined text-tertiary text-4xl mb-3">
            error_outline
          </span>
          <h3 className="font-headline font-bold text-on-surface mb-2">
            Something went wrong
          </h3>
          <p className="font-body text-sm text-on-surface-variant mb-4">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-primary text-on-primary font-label font-semibold px-6 py-2.5 rounded-full text-sm hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
