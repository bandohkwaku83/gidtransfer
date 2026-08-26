"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { images } from "@/lib/marketing/egg-images";
import { ArrowRight } from "./Icons";
import { SectionHeading } from "./SectionHeading";
import Link from "next/link";

const slides = [
  {
    title: "Proof & delivery",
    body: "Galleries that feel like an exhibition — magazine layouts, mobile lightboxes, and downloads clients finish without calling you.",
    image: images.proofDeliveryMockup,
    alt: "Photographer gallery dashboard for proofing and delivery",
    imageClass: "object-cover object-center",
  },
  {
    title: "Decision clarity",
    body: "Contracts, invoices, reminders, and gallery delivery in one place. Less tab-switching. Cleaner client conversations.",
    image: images.decisionClarityMockup,
    alt: "Client gallery on mobile with Originals, Selected, and Finals tabs",
    imageClass: "object-cover object-center",
  },
  {
    title: "Trust & brand",
    body: "Your domain, your colors, watermarks and paywalls when you need them. Clients see your studio — not a platform badge.",
    image: images.trustBrandMockup,
    alt: "GidTransfer brand identity on premium stationery",
    imageClass: "object-cover object-center",
  },
];

export function CarouselSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);

  const scrollTo = (next: number) => {
    const clamped = (next + slides.length) % slides.length;
    setIndex(clamped);
    const el = trackRef.current;
    if (!el) return;
    const card = el.children[clamped] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <section className="py-20 md:py-28 bg-cream overflow-hidden">
      <div className="container-x mb-10 md:mb-14">
        <SectionHeading
          label="Built to last"
          title="Designed for photographers beyond the startup phase"
          body="Proofing, delivery, and brand trust in one system — so clients feel your studio is already established."
        />
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => scrollTo(index - 1)}
            className="h-12 w-12 rounded-full border border-foreground/15 flex items-center justify-center hover:bg-white transition"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => scrollTo(index + 1)}
            className="h-12 w-12 rounded-full border border-foreground/15 flex items-center justify-center hover:bg-white transition"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory px-[max(1.25rem,calc((100vw-1280px)/2+1.25rem))] pb-4 scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {slides.map((slide, i) => {
          const open = hovered === i;
          return (
            <motion.article
              key={slide.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="relative snap-center shrink-0 w-[78vw] sm:w-[400px] md:w-[440px] aspect-[3/4] overflow-hidden rounded-card cursor-pointer"
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                sizes="440px"
                className={`transition duration-700 ${slide.imageClass} ${
                  open ? "scale-[1.04] blur-[1px]" : "scale-100 blur-0"
                }`}
              />

              <motion.div
                animate={{
                  opacity: open ? 0 : 1,
                  y: open ? 16 : 0,
                }}
                transition={{ duration: 0.28 }}
                className="absolute inset-x-4 bottom-4 rounded-[1.1rem] bg-[#231519]/[0.92] text-white px-5 py-4"
              >
                <h3 className="text-lg font-medium tracking-tight">
                  {slide.title}
                </h3>
              </motion.div>

              <motion.div
                initial={false}
                animate={{
                  opacity: open ? 1 : 0,
                  y: open ? 0 : 28,
                }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-3 sm:inset-4 rounded-[1.35rem] bg-[#231519] text-white px-7 py-8 sm:px-8 sm:py-9 flex flex-col shadow-[0_18px_40px_rgba(0,0,0,0.28)] pointer-events-none"
                style={{ pointerEvents: open ? "auto" : "none" }}
              >
                <div>
                  <h3 className="text-[1.65rem] sm:text-[1.85rem] font-medium tracking-tight leading-tight">
                    {slide.title}
                  </h3>
                  <p className="mt-5 text-[#cdbebf] text-[0.98rem] sm:text-[1.02rem] leading-[1.65]">
                    {slide.body}
                  </p>
                </div>
                <Link
                  href="/features"
                  className="mt-auto pt-10 inline-flex items-center gap-2 text-white text-[0.98rem] font-medium w-fit"
                >
                  Learn more
                  <ArrowRight className="w-4 h-4 text-[#6b7cff]" />
                </Link>
              </motion.div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
