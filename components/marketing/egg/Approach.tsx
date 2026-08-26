"use client";

import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import { Folder, Trophy } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { SectionHeading } from "./SectionHeading";

function useCountUp(target: number, active: boolean, duration = 1600) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);

  return value;
}

const stats = [
  {
    icon: <Folder strokeWidth={1.5} className="h-[22px] w-[22px]" />,
    value: 30,
    suffix: "",
    label: "Day free trial to try the full studio",
  },
  {
    icon: <Trophy strokeWidth={1.5} className="h-[22px] w-[22px]" />,
    value: 1,
    suffix: "",
    label: "Studio tools in one calm workspace",
  },
] as const;

const easeOut = [0.22, 1, 0.36, 1] as const;

const cardEntrance = [
  { x: -40, y: 50, rotate: -6 },
  { x: 40, y: 50, rotate: 6 },
] as const;

function StatCard({
  icon,
  value,
  suffix,
  label,
  index,
}: {
  icon: ReactNode;
  value: number;
  suffix: string;
  label: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const n = useCountUp(value, inView, 1400 + index * 180);
  const from = cardEntrance[index] ?? cardEntrance[0]!;

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-40, 40], [8, -8]), {
    stiffness: 220,
    damping: 18,
  });
  const ry = useSpring(useTransform(mx, [-40, 40], [-10, 10]), {
    stiffness: 220,
    damping: 18,
  });

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set(e.clientX - rect.left - rect.width / 2);
    my.set(e.clientY - rect.top - rect.height / 2);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        x: from.x,
        y: from.y,
        rotate: from.rotate,
        scale: 0.86,
        filter: "blur(8px)",
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        filter: "blur(0px)",
      }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{
        type: "spring",
        stiffness: 90,
        damping: 14,
        mass: 0.9,
        delay: 0.08 + index * 0.11,
      }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{
        y: -10,
        scale: 1.03,
        transition: { type: "spring", stiffness: 320, damping: 18 },
      }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-[1.25rem] bg-[#F6F6F9] px-3.5 py-4 will-change-transform sm:rounded-[1.4rem] sm:px-5 sm:py-5 md:rounded-[1.55rem] md:px-6 md:py-6"
    >
      {/* Sweep highlight */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-y-8 -left-1/2 w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/70 to-transparent"
        initial={{ x: "-20%" }}
        whileHover={{ x: "280%" }}
        transition={{ duration: 0.75, ease: easeOut }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand shadow-sm sm:h-10 sm:w-10 sm:rounded-xl"
            animate={
              inView
                ? {
                    rotate: [0, -12, 10, 0],
                    scale: [1, 1.12, 1],
                  }
                : undefined
            }
            transition={{
              duration: 0.85,
              delay: 0.35 + index * 0.12,
              ease: easeOut,
            }}
            whileHover={{ rotate: -8, scale: 1.1 }}
          >
            {icon}
          </motion.span>
          <motion.p
            className="font-sans text-[1.55rem] font-semibold leading-none tracking-tight text-foreground tabular-nums sm:text-[1.95rem] md:text-[2.25rem]"
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.25 + index * 0.1, duration: 0.45 }}
          >
            {n}
            {suffix}
          </motion.p>
        </div>

        <motion.div
          className="my-3 h-px w-full origin-left sm:my-4"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(36,16,24,0.2) 0 3px, transparent 3px 8px)",
          }}
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : undefined}
          transition={{ delay: 0.4 + index * 0.1, duration: 0.55, ease: easeOut }}
        />

        <motion.p
          className="text-[0.78rem] leading-snug text-foreground/55 sm:text-[0.9rem]"
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.48 + index * 0.1, duration: 0.45 }}
        >
          {label}
        </motion.p>
      </div>
    </motion.div>
  );
}

function NotchedImage() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -56, rotate: -2, scale: 0.96 }}
      whileInView={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ type: "spring", stiffness: 70, damping: 16 }}
      className="relative w-full"
    >
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <clipPath id="approach-notch" clipPathUnits="objectBoundingBox">
            <path d="M0.055 0H0.62C0.645 0 0.66 0.015 0.66 0.04V0.105C0.66 0.145 0.69 0.175 0.73 0.175H0.945C0.975 0.175 1 0.2 1 0.23V0.945C1 0.975 0.975 1 0.945 1H0.38C0.355 1 0.34 0.985 0.34 0.96V0.875C0.34 0.835 0.31 0.805 0.27 0.805H0.055C0.025 0.805 0 0.78 0 0.75V0.055C0 0.025 0.025 0 0.055 0Z" />
          </clipPath>
        </defs>
      </svg>

      <div
        className="relative aspect-[4/5] w-full overflow-hidden bg-[#ddd9d6] shadow-[0_30px_80px_rgba(36,16,24,0.14)] sm:aspect-[5/6] lg:min-h-[560px] lg:aspect-auto"
        style={{ clipPath: "url(#approach-notch)" }}
      >
        <motion.div
          initial={{ scale: 1.14 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.4, ease: easeOut }}
          className="absolute inset-0"
        >
          <Image
            src="/images/about-section.jpg"
            alt="Portrait by phloshop"
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover object-[center_20%]"
          />
        </motion.div>
      </div>

      <p className="mt-2.5 text-right font-script text-[1.15rem] leading-none text-foreground/70 md:text-[1.3rem]">
        phloshop
      </p>
    </motion.div>
  );
}

export function Approach() {
  return (
    <section
      id="approach"
      className="relative z-10 -mt-6 rounded-t-[2rem] bg-white md:rounded-t-[2.75rem] py-16 md:py-24"
      style={{ perspective: 1200 }}
    >
      <div className="container-x">
        <SectionHeading
          label="About us"
          title="Who we are. Learn about us"
          body="Built by photographers for studios that already work — galleries, proofing, and delivery shaped to reassure clients who are already considering you."
        />

        <div className="mt-12 grid items-center gap-10 md:mt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 xl:gap-16">
          <NotchedImage />

          <div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {stats.map((stat, i) => (
                <StatCard
                  key={stat.label}
                  icon={stat.icon}
                  value={stat.value}
                  suffix={stat.suffix}
                  label={stat.label}
                  index={i}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
