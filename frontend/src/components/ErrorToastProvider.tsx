import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

/** Tempo até o aviso sumir sozinho (ms). */
const AUTO_DISMISS_MS = 6_000;

type ErrorToastContextValue = {
  showError: (message: string) => void;
  dismissError: () => void;
};

const ErrorToastContext = createContext<ErrorToastContextValue | null>(null);

export function useErrorToast() {
  const ctx = useContext(ErrorToastContext);
  if (!ctx) {
    throw new Error('useErrorToast deve ser usado dentro de ErrorToastProvider');
  }
  return ctx;
}

export function ErrorToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const showError = useCallback((msg: string) => {
    setMessage(msg);
  }, []);

  const dismissError = useCallback(() => setMessage(null), []);

  useEffect(() => {
    if (message === null) return;
    const id = window.setTimeout(() => setMessage(null), AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [message]);

  return (
    <ErrorToastContext.Provider value={{ showError, dismissError }}>
      {children}
      {message && (
        <div
          className="fixed bottom-6 right-6 z-100 max-w-[min(24rem,calc(100vw-3rem))] rounded-xl border border-red-200 bg-white p-4 shadow-2xl ring-1 ring-black/5"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex gap-3">
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700"
              aria-hidden
            >
              !
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">Erro</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">{message}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={dismissError}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </ErrorToastContext.Provider>
  );
}
