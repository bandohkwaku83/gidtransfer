"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const easeOut = [0.22, 1, 0.36, 1] as const;

type SectionHeadingProps = {
  label: string;
  title: ReactNode;
  body?: ReactNode;
  /** Light cream sections vs dark / on-image sections */
  tone?: "light" | "dark";
  className?: string;
  align?: "center" | "left";
  /** Page hero titles can use h1; section blocks default to h2. */
  as?: "h1" | "h2";
};

export function SectionHeading({
  label,
  title,
  body,
  tone = "light",
  className = "",
  align = "center",
  as = "h2",
}: SectionHeadingProps) {
  const dark = tone === "dark";
  const centered = align === "center";
  const Heading = as === "h1" ? motion.h1 : motion.h2;

  return (
    <div
      className={`${centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl text-left"} ${className}`}
    >
      <motion.span
        initial={{ opacity: 0, y: 14, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[0.8rem] ${
          dark
            ? "bg-white/10 text-white/75"
            : "bg-[#eceaea] text-foreground/75"
        }`}
      >
        <span className="inline-block h-2 w-2 rounded-[3px] bg-brand" />
        {label}
      </motion.span>

      <Heading
        initial={{ opacity: 0, y: 34 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: easeOut }}
        className={`mt-5 font-sans text-[2rem] font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[2.6rem] md:text-[3.15rem] ${
          dark ? "text-white" : "text-foreground"
        }`}
      >
        {title}
      </Heading>

      {body ? (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.12, ease: easeOut }}
          className={`mt-4 max-w-xl text-[0.98rem] leading-relaxed sm:text-[1.05rem] ${
            centered ? "mx-auto" : ""
          } ${dark ? "text-white/55" : "text-foreground/55"}`}
        >
          {body}
        </motion.p>
      ) : null}
    </div>
  );
}
