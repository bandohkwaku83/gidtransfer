"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/** Reforma-style soft scroll reveal */
export function LandingReveal({
  children,
  className,
  delayMs = 0,
  scale,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  scale?: boolean;
}) {
  const { ref, visible } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        scale ? "landing-reveal-scale" : "landing-reveal",
        visible && "is-visible",
        className,
      )}
      style={
        delayMs
          ? ({ "--reveal-delay": `${delayMs}ms` } as CSSProperties)
          : undefined
      }
    >
      {children}
    </div>
  );
}

export function LandingCountUp({
  value,
  suffix = "",
  prefix = "",
  durationMs = 1600,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  durationMs?: number;
  className?: string;
}) {
  const { ref, visible } = useInView<HTMLSpanElement>(0.4);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

export const LANDING_MARQUEE_IMAGES = [
  "/images/gallery-covers/WOED0075.JPG",
  "/images/gallery-covers/IMG_5566.JPG",
  "/images/gallery-covers/website_3-min.jpg",
  "/images/gallery-covers/GIDO9970.JPG",
  "/images/gallery-covers/IMG_5261.JPG",
  "/images/gallery-covers/IMG_2185.JPG",
  "/images/client.jpg",
  "/images/login_image.png",
] as const;

/** Slow continuous photo ribbon — Reforma Home A */
export function LandingPhotoMarquee({
  className,
  size = "default",
  priorityCount = 0,
}: {
  className?: string;
  size?: "default" | "hero";
  priorityCount?: number;
}) {
  const loop = [...LANDING_MARQUEE_IMAGES, ...LANDING_MARQUEE_IMAGES];
  const hero = size === "hero";

  return (
    <div className={cn("relative overflow-hidden", className)} aria-hidden>
      <div
        className={cn(
          "flex w-max animate-landing-marquee",
          hero ? "gap-3 sm:gap-4 lg:gap-5" : "gap-4 sm:gap-5",
        )}
      >
        {loop.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className={cn(
              "relative shrink-0 overflow-hidden",
              hero
                ? "h-[min(68vh,36rem)] w-[min(44vw,18rem)] rounded-[1.25rem] sm:h-[min(72vh,40rem)] sm:w-[15rem] sm:rounded-[1.35rem] lg:h-[38rem] lg:w-[22rem] lg:rounded-[1.5rem]"
                : "h-52 w-36 rounded-[1.5rem] sm:h-72 sm:w-52 lg:h-[22rem] lg:w-60",
            )}
          >
            <Image
              src={src}
              alt=""
              fill
              priority={index < priorityCount}
              sizes={hero ? "(max-width: 640px) 42vw, 332px" : "240px"}
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
