"use client";

import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { images } from "@/lib/marketing/egg-images";
import { SectionHeading } from "./SectionHeading";

const tabs = [
  {
    id: "process",
    label: "Gallery clarity",
    title: "Selections you can revisit and explain",
    body: "Every favorite, note, and download leaves a clear trail. Clients and studios stay aligned without replaying the same conversation.",
    image: images.writingClipboard,
    alt: "Engagement portrait gallery",
  },
  {
    id: "team",
    label: "Studio alignment",
    title: "Shared context replaces constant check-ins",
    body: "When contracts, galleries, and delivery status are visible, you don’t need to sync all the time. Everyone understands not just what was decided, but why.",
    image: images.haircut,
    alt: "Studio portrait",
  },
  {
    id: "calm",
    label: "Operational calm",
    title: "Less noise, fewer reversals",
    body: "Clear structure removes guesswork. Work doesn’t get undone because a link expired or a folder went missing. Progress stays steady.",
    image: images.fatherToddler,
    alt: "Client viewing gallery",
  },
];

const easeOut = [0.22, 1, 0.36, 1] as const;

function WorkflowPanel({
  tab,
  index,
  onActive,
}: {
  tab: (typeof tabs)[number];
  index: number;
  onActive: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    amount: 0.45,
    margin: "-15% 0px -15% 0px",
  });

  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  return (
    <div
      id={`workflow-${tab.id}`}
      ref={ref}
      className="grid min-h-[68vh] items-center gap-8 py-2 lg:grid-cols-[1fr_1.05fr] lg:gap-12 xl:gap-16"
    >
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.35 }}
        transition={{ duration: 0.65, ease: easeOut }}
        className="relative mx-auto aspect-[4/5] w-full max-h-[62vh] overflow-hidden rounded-[1.75rem] bg-white/5"
      >
        <Image
          src={tab.image}
          alt={tab.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 40vw"
          className="object-cover object-[center_18%]"
          priority={index === 0}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.4 }}
        transition={{ duration: 0.55, delay: 0.06, ease: easeOut }}
        className="max-w-md"
      >
        <p className="mb-3 text-xs tracking-[0.14em] uppercase text-white/45">
          {tab.label}
        </p>
        <h3 className="mb-5 font-sans text-2xl font-semibold leading-tight tracking-[-0.02em] text-white md:text-[2.35rem]">
          {tab.title}
        </h3>
        <p className="text-lg leading-relaxed text-white/65">{tab.body}</p>
      </motion.div>
    </div>
  );
}

export function SystemTabs() {
  const [active, setActive] = useState(0);

  const scrollToTab = (i: number) => {
    document
      .getElementById(`workflow-${tabs[i]!.id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section
      id="system"
      className="relative text-white"
      style={{ backgroundColor: "#55001F" }}
    >      {/* Header scrolls away with the page — not sticky */}
      <div className="container-x pt-16 md:pt-24 pb-10 md:pb-14">
        <SectionHeading
          tone="dark"
          align="left"
          className="!mx-0 !max-w-4xl !text-left [&_h2]:md:text-[2.6rem] [&_h2]:lg:text-[2.8rem]"
          label="Studio workflow"
          title="One place for galleries, proofing, and payment"
          body="When the studio system lives together, you move faster and clients ask fewer questions. This is what structure is for."
        />
      </div>

      <div className="container-x pb-24 md:pb-32">
        <div className="mb-8 flex flex-wrap gap-2 lg:hidden">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => scrollToTab(i)}
              className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                active === i
                  ? "bg-white text-[#55001F]"
                  : "bg-white/10 text-white/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-10 lg:grid-cols-[0.72fr_2.1fr] lg:gap-12 xl:gap-16">
          {/* Left menu stays stacked while panels scroll */}
          <aside className="relative hidden lg:block">
            <nav
              aria-label="Studio workflow"
              className="sticky top-[28vh] flex flex-col"
            >
              {tabs.map((tab, i) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => scrollToTab(i)}
                  className={`border-b border-white/15 py-5 text-left text-lg transition-colors duration-300 ${
                    active === i
                      ? "text-white"
                      : "text-white/35 hover:text-white/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Image panels with clear gaps between them */}
          <div className="flex flex-col gap-8 md:gap-10 lg:gap-12">
            {tabs.map((tab, i) => (
              <WorkflowPanel
                key={tab.id}
                tab={tab}
                index={i}
                onActive={setActive}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
