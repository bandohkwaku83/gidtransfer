"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  ImagePlus,
  Settings2,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { getAuth } from "@/lib/auth-demo";
import {
  clearDashboardTourSeen,
  hasSeenDashboardTour,
  markDashboardTourSeen,
} from "@/lib/dashboard-tour-storage";
import { cn } from "@/lib/utils";

type TourPlacement = "top" | "bottom" | "left" | "right";
type TourVariant = "panel" | "coach";

type TourStep = {
  id: string;
  title: string;
  body: ReactNode;
  icon: LucideIcon;
  variant?: TourVariant;
  selector?: string;
  route?: string;
  placement?: TourPlacement;
  /** Skipped below `lg`, where the sidebar collapses into a drawer. */
  desktopOnly?: boolean;
};

const STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to your studio",
    body: "A quick pass through the essentials so your first gallery goes out today.",
    icon: FolderOpen,
    variant: "panel",
  },
  {
    id: "sidebar-galleries",
    title: "Every shoot lives here",
    body: "Galleries holds your active shoots, drafts, and trash in one place.",
    icon: FolderOpen,
    selector: '[data-tour="sidebar-galleries"]',
    route: "/dashboard",
    placement: "right",
    desktopOnly: true,
  },
  {
    id: "new-gallery-cta",
    title: "Start with New gallery",
    body: "Create the gallery first — uploads, selections, and finals all hang off it.",
    icon: ImagePlus,
    selector: '[data-tour="new-gallery-cta"]',
    route: "/dashboard/galleries",
    placement: "bottom",
  },
  {
    id: "sidebar-settings",
    title: "Make it yours",
    body: "Branding, watermark defaults, team, and billing all live under Settings.",
    icon: Settings2,
    selector: '[data-tour="sidebar-settings"]',
    route: "/dashboard",
    placement: "right",
    desktopOnly: true,
  },
  {
    id: "profile-menu",
    title: "Plan and replay live here",
    body: "Storage, billing, sign out, and Take a tour are all in this menu.",
    icon: UserRound,
    selector: '[aria-label="Profile menu"]',
    placement: "bottom",
  },
  {
    id: "done",
    title: "You're ready to build",
    body: "Create a gallery and the rest of the dashboard falls into place quickly.",
    icon: Check,
    variant: "panel",
  },
];

const SCREEN_PADDING = 16;
const POPOVER_GAP = 18;
const PANEL_WIDTH = 520;
const COACH_WIDTH = 380;

type TourContextValue = {
  running: boolean;
  startTour: () => void;
  stopTour: () => void;
  restartTour: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

export function useDashboardTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    return {
      running: false,
      startTour: () => {},
      stopTour: () => {},
      restartTour: () => {},
    };
  }
  return ctx;
}

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type PopoverPlacement = TourPlacement | "center";

function waitForElement(
  selector: string,
  timeoutMs = 4000,
): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const found = document.querySelector<HTMLElement>(selector);
    if (found) return resolve(found);

    const deadline = Date.now() + timeoutMs;
    const observer = new MutationObserver(() => {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) {
        cleanup();
        resolve(el);
      } else if (Date.now() > deadline) {
        cleanup();
        resolve(null);
      }
    });

    function cleanup() {
      observer.disconnect();
      clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      cleanup();
      resolve(document.querySelector<HTMLElement>(selector));
    }, timeoutMs);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "aria-hidden", "hidden"],
    });
  });
}

function measure(el: HTMLElement): TargetRect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function popoverPositionFor(
  rect: TargetRect | null,
  placement: TourPlacement | undefined,
  width: number,
): { style: CSSProperties; actualPlacement: PopoverPlacement } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const safeWidth = Math.min(width, vw - SCREEN_PADDING * 2);

  if (!rect || vw < 640) {
    return {
      style: {
        left: "50%",
        top: "50%",
        width: safeWidth,
        transform: "translate(-50%, -50%)",
      },
      actualPlacement: "center",
    };
  }

  const targetCenterX = rect.left + rect.width / 2;
  const targetCenterY = rect.top + rect.height / 2;
  const minHeight = 200;

  const fits = {
    top: rect.top - POPOVER_GAP > minHeight,
    bottom: vh - (rect.top + rect.height) - POPOVER_GAP > minHeight,
    right: vw - (rect.left + rect.width) - POPOVER_GAP > safeWidth + 12,
    left: rect.left - POPOVER_GAP > safeWidth + 12,
  };

  const order: TourPlacement[] = [];
  if (placement) order.push(placement);
  for (const option of ["bottom", "top", "right", "left"] as const) {
    if (!order.includes(option)) order.push(option);
  }
  const chosen = order.find((option) => fits[option]) ?? "bottom";

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(value, max));

  if (chosen === "bottom" || chosen === "top") {
    return {
      style: {
        left: clamp(
          targetCenterX - safeWidth / 2,
          SCREEN_PADDING,
          vw - safeWidth - SCREEN_PADDING,
        ),
        top:
          chosen === "bottom"
            ? rect.top + rect.height + POPOVER_GAP
            : rect.top - POPOVER_GAP,
        width: safeWidth,
        transform: chosen === "top" ? "translateY(-100%)" : undefined,
      },
      actualPlacement: chosen,
    };
  }

  return {
    style: {
      left:
        chosen === "right"
          ? rect.left + rect.width + POPOVER_GAP
          : rect.left - POPOVER_GAP,
      top: clamp(targetCenterY, 130, vh - 130),
      width: safeWidth,
      transform:
        chosen === "left" ? "translate(-100%, -50%)" : "translateY(-50%)",
    },
    actualPlacement: chosen,
  };
}

function TourArrow({ placement }: { placement: PopoverPlacement }) {
  if (placement === "center") return null;

  const positionClass =
    placement === "top"
      ? "left-1/2 top-full -translate-x-1/2 -translate-y-1/2 border-b border-r"
      : placement === "bottom"
        ? "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 border-l border-t"
        : placement === "left"
          ? "left-full top-1/2 -translate-x-1/2 -translate-y-1/2 border-r border-t"
          : "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-b border-l";

  return (
    <span
      aria-hidden
      className={cn(
        "absolute h-3.5 w-3.5 rotate-45 rounded-[3px] border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
        positionClass,
      )}
    />
  );
}

function TourBackdrop({
  rect,
  onSkip,
}: {
  rect: TargetRect | null;
  onSkip: () => void;
}) {
  const shade = "fixed z-[100] bg-zinc-950/55 backdrop-blur-[2px]";

  if (!rect) {
    return (
      <button
        type="button"
        aria-label="Skip tour"
        onClick={onSkip}
        className={cn(shade, "inset-0 animate-in fade-in duration-200")}
      />
    );
  }

  const pad = 10;
  const top = Math.max(0, rect.top - pad);
  const left = Math.max(0, rect.left - pad);
  const right = Math.min(window.innerWidth, rect.left + rect.width + pad);
  const bottom = Math.min(window.innerHeight, rect.top + rect.height + pad);

  const regions: CSSProperties[] = [
    { top: 0, left: 0, right: 0, height: top },
    { top, left: 0, width: left, height: bottom - top },
    { top, left: right, right: 0, height: bottom - top },
    { top: bottom, left: 0, right: 0, bottom: 0 },
  ];

  return (
    <>
      {regions.map((style, index) => (
        <button
          key={index}
          type="button"
          aria-label="Skip tour"
          onClick={onSkip}
          className={shade}
          style={style}
        />
      ))}
    </>
  );
}

function TourProgress({
  stepIndex,
  totalSteps,
}: {
  stepIndex: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors duration-300",
            index <= stepIndex
              ? "bg-zinc-950 dark:bg-zinc-100"
              : "bg-zinc-200 dark:bg-zinc-800",
          )}
        />
      ))}
    </div>
  );
}

function TourPreview({
  icon: Icon,
  compact,
}: {
  icon: LucideIcon;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-[1.35rem] bg-[#eceef2] dark:bg-zinc-900",
        compact ? "h-[148px]" : "h-[196px]",
      )}
    >
      <Icon
        className={cn(
          "text-zinc-400 dark:text-zinc-500",
          compact ? "h-12 w-12" : "h-16 w-16",
        )}
        strokeWidth={1.25}
        aria-hidden
      />
    </div>
  );
}

function TourOverlay({
  stepIndex,
  step,
  totalSteps,
  onPrev,
  onNext,
  onSkip,
  onDone,
}: {
  stepIndex: number;
  step: TourStep;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  onDone: () => void;
}) {
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [ready, setReady] = useState(() => !step.selector);
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!step.selector) return;

    void waitForElement(step.selector).then((el) => {
      if (cancelled) return;
      if (!el) {
        setReady(true);
        return;
      }

      targetRef.current = el;
      try {
        el.scrollIntoView({
          block: "center",
          inline: "center",
          behavior: "smooth",
        });
      } catch {
        el.scrollIntoView();
      }
      setRect(measure(el));
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [step.id, step.selector]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const syncRect = () => {
      if (!targetRef.current || !document.contains(targetRef.current)) return;
      setRect(measure(targetRef.current));
    };

    window.addEventListener("resize", syncRect);
    window.addEventListener("scroll", syncRect, true);
    const resizeObserver = new ResizeObserver(syncRect);
    resizeObserver.observe(target);

    return () => {
      window.removeEventListener("resize", syncRect);
      window.removeEventListener("scroll", syncRect, true);
      resizeObserver.disconnect();
    };
  }, [ready, step.id]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onSkip();
        return;
      }
      if (event.key === "ArrowLeft" && stepIndex > 0) {
        event.preventDefault();
        onPrev();
        return;
      }
      if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        if (stepIndex === totalSteps - 1) onDone();
        else onNext();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDone, onNext, onPrev, onSkip, stepIndex, totalSteps]);

  const isPanel = step.variant === "panel";
  const width = isPanel ? PANEL_WIDTH : COACH_WIDTH;
  const { style: popoverStyle, actualPlacement } = useMemo(
    () => popoverPositionFor(rect, step.placement, width),
    [rect, step.placement, width],
  );

  if (!ready) return null;

  const isLast = stepIndex === totalSteps - 1;
  const highlightPad = 10;
  const highlightStyle: CSSProperties | null = rect
    ? {
        position: "fixed",
        top: rect.top - highlightPad,
        left: rect.left - highlightPad,
        width: rect.width + highlightPad * 2,
        height: rect.height + highlightPad * 2,
        borderRadius: 16,
        pointerEvents: "none",
        boxShadow:
          "0 0 0 2px rgba(255,255,255,0.95), 0 0 0 6px rgba(24,24,27,0.28), 0 20px 45px -20px rgba(0,0,0,0.55)",
        transition:
          "top 200ms cubic-bezier(0.4,0,0.2,1), left 200ms cubic-bezier(0.4,0,0.2,1), width 200ms cubic-bezier(0.4,0,0.2,1), height 200ms cubic-bezier(0.4,0,0.2,1)",
        zIndex: 101,
      }
    : null;

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-live="polite"
      aria-modal="false"
      aria-label={`Tour: ${step.title}`}
    >
      <TourBackdrop rect={rect} onSkip={onSkip} />
      {highlightStyle ? <div style={highlightStyle} aria-hidden /> : null}

      <div
        style={popoverStyle}
        className={cn(
          "fixed z-[102] animate-in fade-in zoom-in-95 duration-200",
          "rounded-[1.75rem] border border-zinc-200/80 bg-white shadow-[0_28px_80px_-28px_rgba(0,0,0,0.42)]",
          "dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-[0_28px_80px_-28px_rgba(0,0,0,0.75)]",
        )}
      >
        <TourArrow placement={actualPlacement} />

        <div className={cn(isPanel ? "px-6 pt-6 pb-5" : "px-5 pt-5 pb-4")}>
          <div className="flex items-start justify-between gap-4">
            <h3
              className={cn(
                "min-w-0 font-semibold tracking-tight text-zinc-950 dark:text-zinc-50",
                isPanel ? "text-[1.45rem] leading-tight" : "text-[1.05rem] leading-snug",
              )}
            >
              {step.title}
            </h3>
            <div className="flex shrink-0 items-center gap-2 pt-0.5">
              <span className="text-[15px] font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
                {stepIndex + 1} / {totalSteps}
              </span>
              <button
                type="button"
                onClick={onSkip}
                aria-label="Skip tour"
                className="-mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="mt-4">
            <TourProgress stepIndex={stepIndex} totalSteps={totalSteps} />
          </div>

          <div className={isPanel ? "mt-5" : "mt-4"}>
            <TourPreview icon={step.icon} compact={!isPanel} />
          </div>

          <p
            className={cn(
              "text-zinc-500 dark:text-zinc-400",
              isPanel
                ? "mt-5 text-[15px] leading-7"
                : "mt-4 text-[13.5px] leading-6",
            )}
          >
            {step.body}
          </p>
        </div>

        <div
          className={cn(
            "flex items-center justify-between gap-3",
            isPanel ? "px-6 pb-6" : "px-5 pb-5",
          )}
        >
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={onPrev}
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Previous
            </button>
          ) : (
            <button
              type="button"
              onClick={onSkip}
              className="px-1 text-sm font-medium text-zinc-400 transition hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
            >
              Skip intro
            </button>
          )}

          <button
            type="button"
            onClick={isLast ? onDone : onNext}
            className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_-16px_rgba(0,0,0,0.7)] transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {isLast ? "Get started" : "Next"}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardTourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1024px)").matches;
  });
  const autoLaunchTriedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const visibleSteps = useMemo(
    () => STEPS.filter((step) => (step.desktopOnly ? isDesktop : true)),
    [isDesktop],
  );
  const total = visibleSteps.length;
  const step = visibleSteps[Math.min(stepIndex, Math.max(total - 1, 0))] ?? null;

  const stop = useCallback(() => {
    markDashboardTourSeen(getAuth()?.user?._id ?? "");
    setRunning(false);
    setStepIndex(0);
  }, []);

  const start = useCallback(() => {
    setStepIndex(0);
    setRunning(true);
  }, []);

  const restart = useCallback(() => {
    clearDashboardTourSeen(getAuth()?.user?._id ?? "");
    setStepIndex(0);
    setRunning(true);
  }, []);

  useEffect(() => {
    if (autoLaunchTriedRef.current) return;
    if (pathname !== "/dashboard") return;

    const userId = getAuth()?.user?._id ?? "";
    if (!userId) return;

    autoLaunchTriedRef.current = true;
    if (hasSeenDashboardTour(userId)) return;

    const timer = window.setTimeout(() => setRunning(true), 900);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!running || !step) return;
    if (step.route && pathname !== step.route) {
      router.push(step.route);
    }
  }, [pathname, router, running, step]);

  const goNext = useCallback(() => {
    setStepIndex((current) => Math.min(current + 1, Math.max(total - 1, 0)));
  }, [total]);

  const goPrev = useCallback(() => {
    setStepIndex((current) => Math.max(current - 1, 0));
  }, []);

  const ctx = useMemo<TourContextValue>(
    () => ({
      running,
      startTour: start,
      stopTour: stop,
      restartTour: restart,
    }),
    [restart, running, start, stop],
  );

  return (
    <TourContext.Provider value={ctx}>
      {children}
      {running && step ? (
        <TourOverlay
          key={step.id}
          stepIndex={stepIndex}
          step={step}
          totalSteps={total}
          onPrev={goPrev}
          onNext={goNext}
          onSkip={stop}
          onDone={stop}
        />
      ) : null}
    </TourContext.Provider>
  );
}
