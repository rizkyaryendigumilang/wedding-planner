import React from "react";
import { AlertTriangle, RefreshCw, Home, Trash2 } from "lucide-react";

/**
 * Komponen batas penanganan kesalahan (Error Boundary) untuk mencegah
 * White Screen of Death (WSOD) di React 19.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary menangkap galat runtime:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = import.meta.env.BASE_URL || "/";
  };

  handleClearCacheAndReload = () => {
    try {
      if (typeof window !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith("wedding_") || k.includes("cache"))) {
            localStorage.removeItem(k);
          }
        }
      }
    } catch (_) {}
    window.location.href = import.meta.env.BASE_URL || "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-canvas dark:bg-night-canvas text-ink dark:text-night-ink flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-night-card border border-rose-200 dark:border-rose-900/40 rounded-2xl p-6 sm:p-8 shadow-lift text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-5">
              <AlertTriangle size={28} />
            </div>

            <h1 className="font-serif text-2xl font-bold tracking-tight mb-2 text-ink dark:text-night-ink">
              Terjadi Kendala pada Tampilan
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted dark:text-night-muted mb-6 leading-relaxed">
              Halaman mengalami galat saat memuat komponen. Jangan khawatir, data pernikahan Anda tetap aman di server.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-medium text-sm shadow-subtle hover:bg-primary-dark transition active:scale-[0.98]"
              >
                <RefreshCw size={16} />
                Muat Ulang Halaman
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-canvas dark:bg-night-canvas border border-line dark:border-night-line text-ink dark:text-night-ink font-medium text-sm hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <Home size={16} />
                Kembali ke Beranda
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-ink-muted hover:text-rose-600 dark:hover:text-rose-400 text-xs transition"
              >
                <Trash2 size={13} />
                Bersihkan Cache & Muat Ulang
              </button>
            </div>

            {this.state.error && (
              <details className="mt-6 text-left border-t border-line dark:border-night-line pt-4">
                <summary className="text-xs text-ink-muted dark:text-night-muted cursor-pointer hover:underline select-none">
                  Lihat rincian teknis galat
                </summary>
                <pre className="mt-2.5 p-3 rounded-lg bg-black/5 dark:bg-white/5 text-[11px] font-mono text-rose-700 dark:text-rose-300 overflow-x-auto max-h-40 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
