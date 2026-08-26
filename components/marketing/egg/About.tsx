"use client";

import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight } from "./Icons";

export function About() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  return (
    <section id="about" className="relative bg-cream pb-16 md:pb-24">
      <div className="relative h-[58vh] min-h-[420px] w-full overflow-hidden md:h-[78vh] md:min-h-[640px]">
        <video
          ref={videoRef}
          src="/images/home-video.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Studio gallery walkthrough"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={paused ? "Play video" : "Pause video"}
          className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50 md:right-6"
        >
          {paused ? (
            <Play className="h-4 w-4 fill-current" />
          ) : (
            <Pause className="h-4 w-4 fill-current" />
          )}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.75 }}
        className="relative z-10 mx-[4%] -mt-28 sm:-mt-36 md:-mt-44 lg:-mt-52"
      >
        <div className="rounded-[1.75rem] bg-[#e4e9e4] px-8 py-10 shadow-[0_20px_50px_rgba(34,18,22,0.12)] sm:px-12 sm:py-12 md:rounded-[2rem] md:px-16 md:py-16 lg:px-20 lg:py-20">
          <h2 className="max-w-4xl font-display text-[1.85rem] font-medium leading-[1.15] tracking-[-0.03em] text-foreground sm:text-[2.35rem] md:text-[2.85rem]">
            Your Entire Studio, In One Place.
          </h2>
          <p className="mt-5 max-w-3xl text-[1.02rem] leading-relaxed text-foreground/55 sm:text-[1.12rem] md:mt-6 md:max-w-4xl md:text-[1.2rem] md:leading-[1.65]">
            From galleries and client management to invoices, schedules, and
            final delivery, everything you need to run your studio and deliver
            work that looks as good as it deserves.
          </p>
          <Link
            href="/features"
            className="link-arrow mt-8 text-[1.05rem] md:mt-10"
          >
            Read our story <ArrowRight />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
