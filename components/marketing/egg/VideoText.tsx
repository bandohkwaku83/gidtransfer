"use client";

import Image from "next/image";
import { images } from "@/lib/marketing/egg-images";
import { SectionHeading } from "./SectionHeading";

export function VideoText() {
  return (
    <section className="relative min-h-[70vh] md:min-h-[900px] flex items-center overflow-hidden">
      <Image
        src={images.videoCover}
        alt="Photographer workspace"
        fill
        sizes="100vw"
        className="object-cover"
        priority={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/25" />
      <div className="relative z-10 container-x py-20 md:py-28">
        <SectionHeading
          tone="dark"
          label="Where it fits"
          title="Efficiency isn’t about adding more tools"
          body="It’s about aligning what already moves — galleries, proofing, and delivery in one calm studio workspace."
        />
      </div>
    </section>
  );
}
