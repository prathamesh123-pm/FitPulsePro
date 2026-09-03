import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
      copied: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("FitPulse ErrorBoundary caught an unhandled error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("FITPULSE_") || key.includes("STATE"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn("Could not clear localStorage:", e);
    }
    if (this.props.onReset) {
      this.props.onReset();
    }
    window.location.reload();
  };

  private handleCopyError = () => {
    const errorText = `Error: ${this.state.error?.message || "Unknown error"}\n\nStack:\n${this.state.error?.stack || "No stack trace"}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack || "None"}`;
    navigator.clipboard.writeText(errorText);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
          <div className="max-w-lg w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-rose-950/20 backdrop-blur-xl">
            {/* Header / Brand */}
            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-100">
                  {this.props.fallbackTitle || "Something went wrong / काहीतरी त्रुटी झाली"}
                </h1>
                <p className="text-xs text-slate-400">
                  FitPulse Pro • Recovery & Diagnostics
                </p>
              </div>
            </div>

            {/* Error Message */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 mb-6 text-xs text-rose-300 font-mono break-words leading-relaxed">
              {this.state.error?.message || "An unexpected rendering error occurred."}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload Application (रिलोड करा)</span>
              </button>
              <button
                type="button"
                onClick={this.handleResetStorage}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                title="Clears local cache in case of corrupted state"
              >
                <Trash2 className="h-4 w-4 text-rose-400" />
                <span>Clear Cache & Restart</span>
              </button>
            </div>

            {/* Diagnostics Collapsible */}
            <div className="border-t border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-400 hover:text-slate-300 py-1 transition"
              >
                <span>Technical Stack Trace (तांत्रिक तपशील)</span>
                {this.state.showDetails ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 space-y-2">
                  <div className="max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 p-3 rounded-xl text-[10px] text-slate-400 font-mono whitespace-pre-wrap select-all">
                    {this.state.error?.stack || "No call stack available"}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {"\n\nComponent Hierarchy:"}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={this.handleCopyError}
                    className="w-full py-1.5 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-[11px] text-slate-300 flex items-center justify-center gap-1.5 transition"
                  >
                    {this.state.copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Diagnostic Report</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
