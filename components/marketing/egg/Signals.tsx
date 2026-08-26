"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { images } from "@/lib/marketing/egg-images";
import { SectionHeading } from "./SectionHeading";

const rowA = [
  {
    type: "quote" as const,
    quote:
      "Nothing fights for attention. The galleries feel considered and already trusted — like a studio that’s been here longer than it needs to prove.",
    name: "Ama Boateng",
    role: "Wedding photographer, Accra",
    tone: "bg-[#eceaea]",
  },
  {
    type: "image" as const,
    src: images.seniorDock,
    alt: "Heritage portrait",
  },
  {
    type: "quote" as const,
    quote:
      "I started with galleries, then moved bookings and invoicing onto the same platform. Proofing and delivery in one place changed how I run my studio.",
    name: "Jules Marin",
    role: "Editorial portraits, Paris",
    tone: "bg-[#f0ebe3]",
  },
  {
    type: "image" as const,
    src: images.familyCouch,
    alt: "Family portrait",
  },
  {
    type: "quote" as const,
    quote:
      "Clear navigation. Familiar patterns. Clients understand the gallery before they dig into the details.",
    name: "Sade Okafor",
    role: "Studio founder, Lagos",
    tone: "bg-[#e8edf1]",
  },
];

const rowB = [
  {
    type: "image" as const,
    src: images.elderlyPhone,
    alt: "Photographer workspace",
  },
  {
    type: "quote" as const,
    quote:
      "Locked finals until payment, branded galleries, zero commission. Every element has a reason to exist.",
    name: "Ama Boateng",
    role: "Wedding photographer, Accra",
    tone: "bg-[#e4ebf2]",
  },
  {
    type: "image" as const,
    src: images.hikingBoots,
    alt: "Outdoor lifestyle",
  },
  {
    type: "quote" as const,
    quote:
      "Growth, new chapters, new shoots — all without friction. The structure adapts without breaking the brand.",
    name: "Jules Marin",
    role: "Editorial portraits, Paris",
    tone: "bg-[#eceaea]",
  },
  {
    type: "image" as const,
    src: images.coffeeKitchen,
    alt: "Lifestyle photography",
  },
];

function Card({
  item,
}: {
  item: (typeof rowA)[number] | (typeof rowB)[number];
}) {
  if (item.type === "image") {
    return (
      <div className="relative w-[260px] md:w-[320px] h-[220px] md:h-[260px] shrink-0 overflow-hidden rounded-card">
        <Image src={item.src} alt={item.alt} fill sizes="320px" className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`w-[300px] md:w-[360px] h-[220px] md:h-[260px] shrink-0 rounded-card p-6 md:p-7 flex flex-col justify-between ${item.tone}`}
    >
      <p className="text-[0.98rem] md:text-[1.05rem] leading-relaxed">
        “{item.quote}”
      </p>
      <div>
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-[#6b5f64]">{item.role}</p>
      </div>
    </div>
  );
}

function MarqueeRow({
  items,
  reverse = false,
  duration = "50s",
}: {
  items: typeof rowA | typeof rowB;
  reverse?: boolean;
  duration?: string;
}) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden">
      <div
        className="flex w-max gap-4 md:gap-5 motion-marquee"
        style={{
          animation: `marquee ${duration} linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {doubled.map((item, i) => (
          <Card key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

export function Signals() {
  return (
    <section id="signals" className="py-20 md:py-28 overflow-hidden bg-cream">
      <div className="container-x mb-12 md:mb-16">
        <SectionHeading
          label="Signals of trust"
          title="Not about reinventing your brand"
          body="A stable system for studios that already work — built to support trust, proof, and long-term delivery."
        />
      </div>

      <div className="space-y-4 md:space-y-5">
        <MarqueeRow items={rowA} duration="55s" />
        <MarqueeRow items={rowB} reverse duration="62s" />
      </div>
    </section>
  );
}
