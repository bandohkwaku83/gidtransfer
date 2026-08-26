"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "./Icons";
import { SectionHeading } from "./SectionHeading";

const features = [
  {
    num: "01",
    title: "Foundation",
    body: "Upload the shoot, set the cover, dress the gallery in your brand. Structure that feels intentional from the first client link — no sales pressure, just clear signals that you know what you’re doing.",
    image: "/images/features-home/photo_2026-08-22_19-14-58.jpg",
    alt: "Portrait by phloshop",
    credit: "phloshop",
    bg: "bg-[#dfe8ee]",
    imageClass: "object-cover",
  },
  {
    num: "02",
    title: "Credibility",
    body: "Send a proofing experience clients understand without a tutorial. Selections, favorites, and feedback stay in one calm flow so doubt disappears before anyone asks.",
    image: "/images/features-home/photo_2026-08-22_19-16-16.jpg",
    alt: "Portrait by phloshop",
    credit: "phloshop",
    bg: "bg-[#e6e2ec]",
    imageClass: "object-cover object-[center_18%]",
  },
  {
    num: "03",
    title: "Structure",
    body: "Unlock finals when you’re ready. Watermarks, download limits, paywalls — a system designed to hold up as the studio grows without breaking consistency or brand.",
    image: "/images/features-home/photo_2026-08-22_19-22-04.jpg",
    alt: "Portrait by asapfotography",
    credit: "asapfotography",
    bg: "bg-[#e8ebe4]",
    imageClass: "object-cover",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28 bg-cream">
      <div className="container-x">
        <SectionHeading
          className="mb-12 md:mb-16"
          label="Features"
          title="A stable system for studios that already work"
          body="Foundation, credibility, and structure — the quiet layers that make client delivery feel intentional from the first link."
        />

        <div className="relative">
          {features.map((f, i) => (
            <div
              key={f.num}
              className="md:sticky top-28 mb-6 md:mb-[18vh] motion-layer"
              style={{ zIndex: i + 1 }}
            >
              <motion.article
                initial={{ opacity: 0, y: 48 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.75, delay: 0.05 }}
                className={`grid lg:grid-cols-2 gap-0 overflow-hidden rounded-card ${f.bg} shadow-[0_20px_60px_rgba(36,16,24,0.08)]`}
              >
                <div className="p-8 md:p-12 lg:p-14 flex flex-col justify-between min-h-[300px]">
                  <div>
                    <p className="text-lg md:text-xl mb-6 tracking-tight">
                      <span className="font-light text-foreground/50">
                        {f.num}
                      </span>{" "}
                      <span className="font-semibold">{f.title}</span>
                    </p>
                    <p className="text-[#6b5f64] text-lg leading-relaxed max-w-md">
                      {f.body}
                    </p>
                  </div>
                  <Link href="/features" className="link-arrow mt-10 w-fit">
                    Learn more <ArrowRight />
                  </Link>
                </div>
                <div className="relative min-h-[260px] md:min-h-[400px] p-4 md:p-5">
                  <div className="relative h-full min-h-[240px] md:min-h-[370px] overflow-hidden rounded-[1.35rem]">
                    <Image
                      src={f.image}
                      alt={f.alt}
                      fill
                      sizes="(max-width:1024px) 100vw, 50vw"
                      className={f.imageClass}
                    />
                    <p className="pointer-events-none absolute bottom-3 right-4 font-script text-[1.15rem] leading-none text-white md:bottom-4 md:right-5 md:text-[1.35rem]">
                      {f.credit}
                    </p>
                  </div>
                </div>
              </motion.article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
