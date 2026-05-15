"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  kind: ToastKind;
};

type ToastContextValue = {
  showToast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/** Ant Design `message` default is ~3s — keep the same feel without importing AntD at the root. */
const TOAST_MS = 3000;

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastIcon({ kind }: { kind: ToastKind }) {
  const common = "h-3.5 w-3.5 shrink-0 stroke-2";
  if (kind === "error") {
    return <AlertCircle className={common} aria-hidden />;
  }
  if (kind === "success") {
    return <CheckCircle2 className={common} aria-hidden />;
  }
  return <Info className={common} aria-hidden />;
}

/** Left icon circle — close to Ant Design message.success / message.error / message.info. */
function iconWrapClass(kind: ToastKind): string {
  if (kind === "success") {
    return "bg-[#52c41a] text-white";
  }
  if (kind === "error") {
    return "bg-[#ff4d4f] text-white";
  }
  return "bg-[#1677ff] text-white";
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<number, number>>(new Map());

  const removeToast = useCallback((id: number) => {
    const t = timeoutsRef.current.get(id);
    if (t !== undefined) {
      window.clearTimeout(t);
      timeoutsRef.current.delete(id);
    }
    setToasts((list) => list.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    return () => {
      for (const t of timeoutsRef.current.values()) {
        window.clearTimeout(t);
      }
      timeoutsRef.current.clear();
    };
  }, []);

  const showToast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = Date.now() + Math.random();
      setToasts((list) => [...list, { id, message, kind }]);
      const tid = window.setTimeout(() => removeToast(id), TOAST_MS);
      timeoutsRef.current.set(id, tid);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={cn(
          "pointer-events-none fixed top-0 z-[10100] flex w-full max-w-[min(36rem,calc(100vw-1.5rem))] flex-col items-center gap-2 px-3 pt-[max(12px,env(safe-area-inset-top))]",
          /* Mobile: viewport center. lg+: center in main column past 280px sidebar */
          "left-1/2 -translate-x-1/2 lg:left-[calc((100vw+280px)/2)]",
        )}
        aria-live="polite"
        aria-relevant="additions text"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-none flex items-center gap-3 rounded-xl px-4 py-2.5",
              /* Lift off sidebar + logo card: frost, ring, stronger shadow */
              "border border-zinc-300/70 bg-white/92 text-zinc-900",
              "shadow-[0_12px_40px_-12px_rgba(15,23,42,0.2),0_8px_24px_-8px_rgba(15,23,42,0.14)]",
              "ring-1 ring-zinc-900/[0.06] backdrop-blur-md backdrop-saturate-150",
              "dark:border-zinc-500/50 dark:bg-zinc-800/92 dark:text-zinc-50 dark:ring-white/[0.08]",
            )}
            style={{ animation: "toast-enter 0.2s ease-out both" }}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px]",
                iconWrapClass(t.kind),
              )}
            >
              <ToastIcon kind={t.kind} />
            </span>
            <p className="max-w-[min(32rem,calc(100vw-4rem))] text-[14px] leading-[22px] text-zinc-800 dark:text-zinc-100">
              {t.message}
            </p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
