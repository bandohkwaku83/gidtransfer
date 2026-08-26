"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { images } from "@/lib/marketing/egg-images";
import { ArrowRight } from "./Icons";

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

const cases = [
  {
    label: "Client support tickets reduced",
    value: 37,
    prefix: "−",
    suffix: "%",
    brand: "Fewer “how do I download?” emails",
    image: images.seniorDock,
    tone: "dark" as const,
  },
  {
    label: "Faster proofing turnaround",
    value: 42,
    prefix: "",
    suffix: "%",
    brand: "Selections in one calm flow",
    image: null,
    tone: "cream" as const,
  },
  {
    label: "Delivery time shortened",
    value: 3,
    prefix: "",
    suffix: "x",
    brand: "From shoot to finals, faster",
    image: null,
    tone: "white" as const,
  },
];

function CaseCard({
  item,
  active,
  delay,
}: {
  item: (typeof cases)[number];
  active: boolean;
  delay: number;
}) {
  const n = useCountUp(item.value, active);
  const dark = item.tone === "dark";

  return (
    <motion.article
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.65, delay }}
      className={`relative overflow-hidden rounded-card aspect-[3/4] p-6 md:p-7 flex flex-col justify-between ${
        item.tone === "cream"
          ? "bg-[#efeae2]"
          : item.tone === "white"
            ? "bg-white"
            : "bg-dark text-white"
      }`}
    >
      {item.image && (
        <>
          <Image
            src={item.image}
            alt=""
            fill
            sizes="33vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/45" />
        </>
      )}

      <div className="relative z-10">
        <p
          className={`text-[0.68rem] tracking-[0.12em] uppercase mb-4 ${
            dark ? "text-white/70" : "text-[#6b5f64]"
          }`}
        >
          {item.label}
        </p>
        <p
          className={`font-display text-5xl md:text-6xl tracking-tight ${
            dark ? "text-white" : "text-foreground"
          }`}
        >
          {item.prefix}
          {n}
          <span className="text-3xl">{item.suffix}</span>
        </p>
      </div>

      <div
        className={`relative z-10 text-lg font-medium tracking-tight ${
          dark ? "text-white" : "text-foreground"
        }`}
      >
        {item.brand}
      </div>
    </motion.article>
  );
}

export function CaseStudies() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <section id="case-studies" ref={ref} className="py-20 md:py-28 bg-cream">
      <div className="container-x">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16 mb-12 md:mb-16">
          <div>
            <p className="section-label">Outcomes</p>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-[2.2rem] md:text-[3.4rem] leading-[1.08] tracking-[-0.02em]"
            >
              We’ve helped studios ship cleaner
            </motion.h2>
          </div>
          <div className="lg:pt-10">
            <p className="text-[#6b5f64] text-lg mb-6">
              Same principle: less friction, more clarity, better client
              decisions.
            </p>
            <Link href="/features" className="link-arrow">
              Explore features <ArrowRight />
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {cases.map((item, i) => (
            <CaseCard
              key={item.brand}
              item={item}
              active={inView}
              delay={i * 0.08}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
