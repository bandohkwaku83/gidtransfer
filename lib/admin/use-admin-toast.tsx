"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";

type ToastType = "success" | "error";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 5000;

let toastId = 0;

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const isSuccess = toast.type === "success";

  useEffect(() => {
    const timer = setTimeout(onDismiss, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="alert"
      className="toast-enter pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
      style={{
        borderColor: isSuccess ? "rgb(167 243 208)" : "rgb(254 202 202)",
      }}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            isSuccess ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-semibold text-slate-900">
            {isSuccess ? "Success" : "Something went wrong"}
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="h-1 bg-slate-100">
        <div
          className={`toast-progress h-full ${isSuccess ? "bg-emerald-500" : "bg-red-500"}`}
        />
      </div>
    </div>
  );
}

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed top-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within AdminToastProvider");
  return ctx;
}
