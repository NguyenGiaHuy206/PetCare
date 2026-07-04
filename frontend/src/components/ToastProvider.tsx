import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  title?: string;
};

type ToastOptions = {
  title?: string;
  durationMs?: number;
};

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const createToastId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info", options?: ToastOptions) => {
      const id = createToastId();
      const defaultDurationMs = variant === "error" ? 8000 : 4000;
      const durationMs = options?.durationMs ?? defaultDurationMs;
      const toast: ToastItem = {
        id,
        message,
        variant,
        title: options?.title,
      };

      setToasts((current) => [...current, toast]);

      if (durationMs > 0) {
        window.setTimeout(() => removeToast(id), durationMs);
      }
    },
    [removeToast]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: showToast,
      success: (message, options) => showToast(message, "success", options),
      error: (message, options) => showToast(message, "error", options),
      info: (message, options) => showToast(message, "info", options),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => {
          const variantStyles =
            toast.variant === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : toast.variant === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-blue-50 border-blue-200 text-blue-800";

          return (
            <div
              key={toast.id}
              className={`min-w-[240px] max-w-[360px] rounded-lg border px-4 py-3 shadow-lg ${variantStyles}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
                  <p className="text-sm">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-xs font-semibold opacity-70 hover:opacity-100"
                  aria-label="Dismiss notification"
                >
                  Close
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
