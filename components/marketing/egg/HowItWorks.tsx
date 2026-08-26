"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { SectionHeading } from "./SectionHeading";

const points = [
  {
    title: "Move with confidence",
    body: "Galleries, contracts, and delivery live in one workspace — decisions rest on clear structure, not assumptions or a dozen tabs.",
  },
  {
    title: "Reduce friction",
    body: "Clients find favorites, leave notes, and download where they expect. You stop re-explaining the process.",
  },
  {
    title: "Protect credibility",
    body: "Your domain, your brand, watermarks and paywalls when you need them. The studio looks as solid as the work.",
  },
];

const media = [
  {
    src: "/images/how-it-work/photo_2026-08-22_19-10-57.jpg",
    alt: "Studio how it works",
  },
  {
    src: "/images/how-it-work/photo_2026-08-22_19-11-58.jpg",
    alt: "Client gallery workflow",
  },
  {
    src: "/images/how-it-work/IMG_7292.JPG",
    alt: "Portrait delivery",
  },
  {
    src: "/images/how-it-work/IMG_7351-2.JPG",
    alt: "Studio session",
  },
];

const easeOut = [0.22, 1, 0.36, 1] as const;

export function HowItWorks() {
  const [playing, setPlaying] = useState(true);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % media.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [playing]);

  const current = media[frame]!;

  return (
    <section id="how" className="py-20 md:py-28 bg-cream">
      <div className="container-x">
        <SectionHeading
          className="mb-14 md:mb-16"
          label="How it works"
          title="Structure, proof, and confidence when you need them"
          body="Gidtransfer supports studios at the exact moment galleries, selections, and delivery have to feel solid."
        />

        <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 xl:gap-20">
          <div className="max-w-xl">
            <motion.h3
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: easeOut }}
              className="font-sans text-[1.85rem] sm:text-[2.15rem] font-semibold leading-tight tracking-[-0.03em] text-foreground"
            >
              Fewer assumptions
            </motion.h3>

            <div className="mt-9 space-y-8">
              {points.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{
                    duration: 0.55,
                    delay: 0.08 + i * 0.1,
                    ease: easeOut,
                  }}
                  className="flex gap-4"
                >
                  <span
                    aria-hidden
                    className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"
                  >
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                      <path
                        d="M2.4 6.2l2.5 2.5 4.7-5.2"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <h4 className="font-sans text-[1.05rem] font-semibold tracking-tight text-foreground">
                      {p.title}
                    </h4>
                    <p className="mt-1.5 text-[0.98rem] leading-relaxed text-foreground/55">
                      {p.body}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.35, ease: easeOut }}
              className="mt-11"
            >
              <Link
                href="/features#how-it-works"
                className="inline-flex items-center justify-center rounded-full bg-[#eceaea] px-6 py-3.5 text-[0.95rem] font-medium tracking-tight text-foreground transition hover:bg-[#e3e1e1]"
              >
                Explore how it works
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 36, scale: 0.98 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.85, ease: easeOut }}
            className="relative"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-[#ddd9d6] shadow-[0_28px_70px_rgba(36,16,24,0.12)] sm:aspect-[5/6] lg:min-h-[560px] lg:aspect-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.src}
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: playing ? 1.04 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: easeOut }}
                  className="absolute inset-0"
                >
                  <Image
                    src={current.src}
                    alt={current.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 52vw"
                    className="object-cover object-[center_18%]"
                    priority={false}
                  />
                </motion.div>
              </AnimatePresence>

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

              <button
                type="button"
                aria-label={playing ? "Pause" : "Play"}
                onClick={() => setPlaying((v) => !v)}
                className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-xl bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/65"
              >
                {playing ? (
                  <span className="flex gap-1">
                    <span className="h-3.5 w-1 rounded-sm bg-white" />
                    <span className="h-3.5 w-1 rounded-sm bg-white" />
                  </span>
                ) : (
                  <span className="ml-0.5 h-0 w-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-white" />
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
