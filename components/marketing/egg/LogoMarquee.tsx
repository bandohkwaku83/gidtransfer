const logos = [
  "Weddings",
  "Portraits",
  "Editorial",
  "Commercial",
  "Events",
  "Family",
  "Fashion",
  "Documentary",
];

function MarqueeItems({ suffix }: { suffix: string }) {
  return (
    <>
      {logos.map((name, i) => (
        <span
          key={`${suffix}-${name}-${i}`}
          className="flex items-center gap-8 md:gap-12"
        >
          <span className="font-heading text-[1.35rem] md:text-[1.75rem] font-medium tracking-tight text-foreground/50 whitespace-nowrap transition-colors duration-300 hover:text-brand">
            {name}
          </span>
          <span
            aria-hidden
            className="relative flex h-2 w-2 shrink-0 items-center justify-center"
          >
            <span className="absolute inset-0 rounded-full bg-brand/15" />
            <span className="relative h-1 w-1 rounded-full bg-brand/55" />
          </span>
        </span>
      ))}
    </>
  );
}

export function LogoMarquee() {
  return (
    <section
      aria-label="Photography genres supported"
      className="group/marquee relative overflow-hidden border-y border-foreground/[0.07] bg-cream py-5 md:py-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 sm:w-20 md:w-32 bg-gradient-to-r from-cream via-cream/80 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 sm:w-20 md:w-32 bg-gradient-to-l from-cream via-cream/80 to-transparent"
      />

      <div className="flex w-max animate-marquee-slow motion-marquee items-center gap-8 px-4 md:gap-12 md:px-6 group-hover/marquee:[animation-play-state:paused]">
        <MarqueeItems suffix="a" />
        <MarqueeItems suffix="b" />
      </div>
    </section>
  );
}
