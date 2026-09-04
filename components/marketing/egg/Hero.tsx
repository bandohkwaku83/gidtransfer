"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  AnimatePresence,
  useMotionValueEvent,
} from "framer-motion";
import Image from "next/image";
import { useRef, useState } from "react";
import { heroImages } from "@/lib/marketing/egg-images";
import { cn } from "@/lib/utils";

const phrases = [
  "This platform isn’t here to convince new clients",
  "It’s here to reassure the ones already considering you",
  "The decision was already made. This just confirms it.",
];

const strip = heroImages;

/** Image used for the full-bleed scroll expand */
const expandImage =
  strip.find((img) => img.src.includes("GIDO4045")) ?? strip[Math.floor(strip.length / 2)]!;
const loopStrip = [...strip, ...strip];

/** Masonry sizes matched to each hero image (same order as `heroImages`) */
const masonryStyles = [
  { width: "w-[140px] sm:w-[175px] md:w-[210px] lg:w-[250px]", height: "h-[210px] sm:h-[270px] md:h-[330px] lg:h-[390px]", y: -10 },
  { width: "w-[150px] sm:w-[190px] md:w-[230px] lg:w-[270px]", height: "h-[255px] sm:h-[325px] md:h-[395px] lg:h-[460px]", y: 16 },
  { width: "w-[130px] sm:w-[165px] md:w-[200px] lg:w-[235px]", height: "h-[175px] sm:h-[220px] md:h-[270px] lg:h-[315px]", y: -4 },
  { width: "w-[160px] sm:w-[200px] md:w-[245px] lg:w-[290px]", height: "h-[270px] sm:h-[345px] md:h-[420px] lg:h-[490px]", y: 20 },
  { width: "w-[135px] sm:w-[170px] md:w-[205px] lg:w-[245px]", height: "h-[200px] sm:h-[255px] md:h-[310px] lg:h-[360px]", y: -14 },
  { width: "w-[145px] sm:w-[180px] md:w-[220px] lg:w-[260px]", height: "h-[240px] sm:h-[305px] md:h-[370px] lg:h-[430px]", y: 10 },
] as const;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const phraseIndexRef = useRef(0);
  const pausedRef = useRef(false);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const titleOpacity = useTransform(scrollYProgress, [0, 0.1, 0.22], [1, 0.35, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.22], [0, -56]);
  const stripX = useTransform(scrollYProgress, [0, 0.18], ["0%", "-4%"]);
  const stripOpacity = useTransform(scrollYProgress, [0.04, 0.16], [1, 0]);
  const bottomCopyOpacity = useTransform(scrollYProgress, [0, 0.08, 0.16], [1, 0.5, 0]);

  const coverScale = useTransform(
    scrollYProgress,
    reducedMotion ? [0.05, 0.12] : [0.05, 0.34],
    reducedMotion ? [1, 1] : [0.18, 1],
  );

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phrasesVisible, setPhrasesVisible] = useState(false);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [coverActive, setCoverActive] = useState(false);
  const phrasesVisibleRef = useRef(false);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // After expand: first text, then scroll advances to 2nd / 3rd in order
    const showPhrases = v >= 0.34;
    if (showPhrases !== phrasesVisibleRef.current) {
      phrasesVisibleRef.current = showPhrases;
      setPhrasesVisible(showPhrases);
    }

    let nextPhrase = 0;
    if (v >= 0.7) nextPhrase = 2;
    else if (v >= 0.52) nextPhrase = 1;
    else nextPhrase = 0;

    if (nextPhrase !== phraseIndexRef.current) {
      phraseIndexRef.current = nextPhrase;
      setPhraseIndex(nextPhrase);
    }

    const nextPaused = v > 0.03;
    if (nextPaused !== pausedRef.current) {
      pausedRef.current = nextPaused;
      setCarouselPaused(nextPaused);
    }

    setCoverActive((prev) => {
      const next = v > 0.05;
      return prev === next ? prev : next;
    });
  });

  const carouselActive = !reducedMotion && !carouselPaused;

  return (
    <section ref={ref} className="relative h-[360vh]">
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col justify-center pt-20 pb-24 md:pt-24 md:pb-28">
          <motion.div
            style={{ opacity: titleOpacity, y: titleY }}
            className="container-x relative z-20 px-6 text-center"
          >
            <motion.h1
              initial={reducedMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="font-sentient font-light text-[2rem] sm:text-[2.65rem] md:text-[3.4rem] lg:text-[3.85rem] leading-[1.08] tracking-[-0.03em] text-foreground max-w-5xl mx-auto"
            >
              Gidtransfer is not about{" "}
              <em className="italic-sentient font-light">reinventing</em> your brand
            </motion.h1>
          </motion.div>

          <motion.div
            style={{ opacity: stripOpacity, x: stripX }}
            className="relative z-10 mt-8 md:mt-10 w-full overflow-hidden motion-layer"
          >
            <div
              className={cn(
                "flex w-max items-center gap-3 md:gap-4 px-4 md:px-8 motion-marquee",
                carouselActive && "animate-hero-marquee",
              )}
              style={{ animationPlayState: carouselActive ? "running" : "paused" }}
            >
              {loopStrip.map((img, i) => {
                const style = masonryStyles[i % masonryStyles.length]!;

                return (
                  <div
                    key={`${img.src}-${i}`}
                    className="relative shrink-0"
                    style={{ transform: `translateY(${style.y}px)` }}
                  >
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-card bg-[#e8e4e2] motion-layer",
                        style.width,
                        style.height,
                      )}
                    >
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        sizes="(max-width: 640px) 180px, (max-width: 1024px) 250px, 330px"
                        className="object-cover"
                        priority={i < strip.length}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <motion.p
          style={{ opacity: bottomCopyOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-6 z-20 mx-auto max-w-lg px-6 text-center text-[0.78rem] sm:text-[0.85rem] md:text-[0.9rem] leading-relaxed text-[#3a2a30]/80 md:bottom-8"
        >
          Stunning galleries, smart studio tools, one place to share, deliver and
          select.
          <br />
          Hosted on your domain, dressed in your brand.
        </motion.p>

        {coverActive && (
          <div className="pointer-events-none absolute inset-0 z-30" aria-hidden={false}>
            <div className="absolute inset-0 bg-cream" />
            <motion.div
              style={{ scale: coverScale }}
              className="absolute inset-0 origin-center overflow-hidden will-change-transform bg-cream"
            >
              <Image
                src={expandImage.src}
                alt={expandImage.alt}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            </motion.div>

            <div
              className="absolute inset-0 bg-black/40"
              aria-hidden
            />

            <motion.div
              initial={false}
              animate={{ opacity: phrasesVisible ? 1 : 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center px-6"
            >
              <div className="overflow-hidden w-[min(92vw,42rem)] text-center min-h-[5rem] flex items-center justify-center">
                {phrasesVisible && (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.h2
                      key={phraseIndex}
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "-100%" }}
                      transition={{
                        duration: 0.55,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="font-sentient font-light text-white text-[1.55rem] sm:text-[2.1rem] md:text-[2.75rem] lg:text-[3rem] leading-[1.14] tracking-[-0.02em] [text-shadow:0_1px_2px_rgba(0,0,0,0.55),0_4px_28px_rgba(0,0,0,0.35)]"
                    >
                      {phrases[phraseIndex]}
                    </motion.h2>
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}
