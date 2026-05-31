"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  coverBackdropStyle,
  coverColorUsesLightText,
  coverColorWithAlpha,
  coverGradientDiagonal,
  coverGradientToTop,
  normalizeGalleryCoverColor,
} from "@/lib/gallery-cover-color";
import {
  galleryCoverFrameLabel,
  isFramedGalleryCoverFrame,
  type GalleryCoverFrame,
} from "@/lib/gallery-cover-frame";
import { cn } from "@/lib/utils";

const SHARE_COVER_IMAGE_QUALITY = 82;

type GalleryCoverHeroProps = {
  coverImageUrl: string;
  coverFrame: GalleryCoverFrame;
  /** Backdrop for styles that use a solid hero color instead of black. */
  coverColor?: string;
  objectPosition: { objectPosition: string };
  displayTitle: string;
  heroBrandLabel?: string | null;
  selectionLocked?: boolean;
  onCoverClick: () => void;
};

function resolveCoverTheme(coverColor?: string) {
  const color = normalizeGalleryCoverColor(coverColor);
  const lightText = coverColorUsesLightText(color);
  return { color, lightText };
}

function CoverImage({
  src,
  alt,
  className,
  style,
  sizes,
  priority = true,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      fetchPriority={priority ? "high" : undefined}
      sizes={sizes}
      quality={SHARE_COVER_IMAGE_QUALITY}
      className={className}
      style={style}
    />
  );
}

function SelectionLockedBanner({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "max-w-md rounded border border-amber-400/35 bg-amber-500/15 px-4 py-2 text-xs text-amber-50",
        className,
      )}
    >
      Selections are temporarily locked by your photographer.
    </p>
  );
}

function ViewGalleryCta({
  className,
  buttonClassName,
}: {
  className?: string;
  buttonClassName?: string;
}) {
  return (
    <a
      href="#client-gallery-body"
      className={cn(
        "inline-flex items-center gap-2.5 border px-8 py-3 text-[11px] font-medium uppercase tracking-[0.22em] transition sm:px-10 sm:py-3.5 sm:text-xs",
        buttonClassName,
      )}
    >
      <ChevronDown className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" aria-hidden />
      View gallery
    </a>
  );
}

function HeroTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "max-w-3xl text-balance text-2xl font-light uppercase tracking-[0.18em] sm:text-3xl md:text-4xl lg:text-[2.75rem]",
        className,
      )}
    >
      {children}
    </h1>
  );
}

function FullBleedHero({
  coverImageUrl,
  coverColor,
  objectPosition,
  displayTitle,
  heroBrandLabel,
  selectionLocked,
  onCoverClick,
}: GalleryCoverHeroProps) {
  const { color } = resolveCoverTheme(coverColor);
  return (
    <section
      className="relative isolate flex min-h-[100svh] min-h-[100dvh] w-full flex-col"
      aria-label="Gallery cover"
    >
      <CoverImage
        src={coverImageUrl}
        alt={displayTitle ? `Cover — ${displayTitle}` : "Gallery cover"}
        className="absolute inset-0 object-cover"
        style={objectPosition}
        sizes="100vw"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: coverColorWithAlpha(color, 0.45) }}
        aria-hidden
      />
      <button
        type="button"
        onClick={onCoverClick}
        className="absolute inset-0 z-[5] cursor-zoom-in bg-transparent p-0"
        aria-label="View cover image full screen"
      />
      {heroBrandLabel ? (
        <div className="relative z-10 px-6 pt-6 sm:px-10 sm:pt-8 lg:px-12">
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-white/95 sm:text-[11px]">
            {heroBrandLabel}
          </p>
        </div>
      ) : null}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-8 text-center sm:pb-20">
        <HeroTitle className="text-white">{displayTitle}</HeroTitle>
        {selectionLocked ? <SelectionLockedBanner className="mt-6" /> : null}
        <ViewGalleryCta
          className="mt-10 sm:mt-12"
          buttonClassName="border-white text-white hover:bg-white/10"
        />
      </div>
    </section>
  );
}

function CinematicHero(props: GalleryCoverHeroProps) {
  const { coverImageUrl, coverColor, objectPosition, displayTitle, heroBrandLabel, selectionLocked, onCoverClick } =
    props;
  const { color, lightText } = resolveCoverTheme(coverColor);
  const barStyle = coverBackdropStyle(color);
  return (
    <section
      className={cn(
        "relative isolate flex min-h-[100svh] min-h-[100dvh] w-full flex-col",
        lightText ? "text-white" : "text-zinc-950",
      )}
      style={barStyle}
      aria-label={galleryCoverFrameLabel("cinematic")}
    >
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="h-[8vh] min-h-8 shrink-0" style={barStyle} aria-hidden />
        <div className="relative mx-auto aspect-[21/9] w-full max-w-6xl flex-1 px-4 sm:px-8">
          <CoverImage
            src={coverImageUrl}
            alt={displayTitle ? `Cover — ${displayTitle}` : "Gallery cover"}
            className="object-cover"
            style={objectPosition}
            sizes="(max-width: 1280px) 100vw, 1152px"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.65)_100%)]" />
          <button
            type="button"
            onClick={onCoverClick}
            className="absolute inset-0 z-[5] cursor-zoom-in bg-transparent"
            aria-label="View cover image full screen"
          />
        </div>
        <div className="h-[8vh] min-h-8 shrink-0" style={barStyle} aria-hidden />
      </div>
      <div className="relative z-10 px-6 pb-14 pt-4 text-center sm:pb-16">
        {heroBrandLabel ? (
          <p
            className={cn(
              "text-[10px] font-medium uppercase tracking-[0.4em]",
              lightText ? "text-white/55" : "text-zinc-600",
            )}
          >
            {heroBrandLabel}
          </p>
        ) : null}
        <HeroTitle className={cn("mx-auto mt-3", lightText ? "text-white" : "text-zinc-950")}>
          {displayTitle}
        </HeroTitle>
        {selectionLocked ? <SelectionLockedBanner className="mx-auto mt-6" /> : null}
        <ViewGalleryCta
          className="mt-8"
          buttonClassName={
            lightText
              ? "border-white/80 text-white hover:bg-white/10"
              : "border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white"
          }
        />
      </div>
    </section>
  );
}

function CollageHero(props: GalleryCoverHeroProps) {
  const { coverImageUrl, objectPosition, displayTitle, heroBrandLabel, selectionLocked, onCoverClick } =
    props;
  const tiles = [
    { className: "left-[4%] top-[10%] z-20 h-[42%] w-[38%] -rotate-6", pos: "30% 40%" },
    { className: "right-[6%] top-[8%] z-30 h-[48%] w-[40%] rotate-5", pos: "70% 25%" },
    { className: "bottom-[12%] left-[18%] z-10 h-[38%] w-[44%] rotate-2", pos: "50% 75%" },
    { className: "bottom-[18%] right-[10%] z-0 h-[32%] w-[30%] -rotate-3 opacity-80", pos: "80% 60%" },
  ];
  const { color, lightText } = resolveCoverTheme(props.coverColor);
  return (
    <section
      className={cn(
        "relative isolate flex min-h-[100svh] min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-8",
        lightText ? "text-white" : "text-zinc-950",
      )}
      style={coverBackdropStyle(color)}
      aria-label={galleryCoverFrameLabel("collage")}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: coverGradientDiagonal(color) }}
      />
      <div className="relative z-10 mb-8 max-w-3xl text-center">
        {heroBrandLabel ? (
          <p
            className={cn(
              "text-[10px] font-medium uppercase tracking-[0.35em]",
              lightText ? "text-white/60" : "text-zinc-600",
            )}
          >
            {heroBrandLabel}
          </p>
        ) : null}
        <HeroTitle className={cn("mx-auto mt-3", lightText ? "text-white" : "text-zinc-950")}>
          {displayTitle}
        </HeroTitle>
      </div>
      <div className="relative z-10 aspect-[4/3] w-full max-w-4xl">
        {tiles.map((tile, i) => (
          <button
            key={i}
            type="button"
            onClick={onCoverClick}
            className={cn(
              "absolute overflow-hidden rounded-2xl border border-white/20 bg-zinc-800 shadow-2xl shadow-black/50 transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
              tile.className,
            )}
            aria-label={i === 0 ? "View cover image full screen" : undefined}
          >
            <CoverImage
              src={coverImageUrl}
              alt=""
              className="object-cover"
              style={{ objectPosition: tile.pos }}
              sizes="(max-width: 1024px) 45vw, 320px"
              priority={i === 0}
            />
          </button>
        ))}
      </div>
      <div className="relative z-10 mt-10 flex flex-col items-center gap-6">
        {selectionLocked ? <SelectionLockedBanner /> : null}
        <ViewGalleryCta
          buttonClassName={
            lightText
              ? "border-white text-white hover:bg-white/10"
              : "border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white"
          }
        />
      </div>
    </section>
  );
}

function MinimalHero(props: GalleryCoverHeroProps) {
  const { coverImageUrl, objectPosition, displayTitle, heroBrandLabel, selectionLocked, onCoverClick } =
    props;
  return (
    <section
      className="relative isolate flex min-h-[100svh] min-h-[100dvh] flex-col items-center justify-center bg-white px-6 py-16 text-zinc-950 dark:bg-zinc-950 dark:text-white"
      aria-label={galleryCoverFrameLabel("minimal")}
    >
      {heroBrandLabel ? (
        <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-zinc-400 dark:text-zinc-500">
          {heroBrandLabel}
        </p>
      ) : null}
      <HeroTitle className="mt-4 text-center">{displayTitle}</HeroTitle>
      <button
        type="button"
        onClick={onCoverClick}
        className="relative mt-10 aspect-[3/4] w-full max-w-md overflow-hidden rounded-sm shadow-lg shadow-zinc-900/10 transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:shadow-black/40"
        aria-label="View cover image full screen"
      >
        <CoverImage
          src={coverImageUrl}
          alt={displayTitle ? `Cover — ${displayTitle}` : "Gallery cover"}
          className="object-cover"
          style={objectPosition}
          sizes="(max-width: 768px) 90vw, 448px"
        />
      </button>
      {selectionLocked ? <SelectionLockedBanner className="mt-8 dark:text-amber-100" /> : null}
      <ViewGalleryCta
        className="mt-10"
        buttonClassName="border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-zinc-950"
      />
    </section>
  );
}

function BentoHero(props: GalleryCoverHeroProps) {
  const { coverImageUrl, objectPosition, displayTitle, heroBrandLabel, selectionLocked, onCoverClick } =
    props;
  const cells = [
    { className: "col-span-2 row-span-2", pos: objectPosition.objectPosition },
    { className: "", pos: "75% 30%" },
    { className: "", pos: "20% 80%" },
    { className: "col-span-2", pos: "60% 55%" },
  ];
  const { color, lightText } = resolveCoverTheme(props.coverColor);
  return (
    <section
      className={cn(
        "relative isolate flex min-h-[100svh] min-h-[100dvh] flex-col px-4 py-10 sm:px-8",
        lightText ? "text-white" : "text-zinc-950",
      )}
      style={coverBackdropStyle(color)}
      aria-label={galleryCoverFrameLabel("bento")}
    >
      <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
        {heroBrandLabel ? (
          <p
            className={cn(
              "text-[10px] font-medium uppercase tracking-[0.35em]",
              lightText ? "text-white/60" : "text-zinc-600",
            )}
          >
            {heroBrandLabel}
          </p>
        ) : null}
        <HeroTitle className={cn("mx-auto mt-3", lightText ? "text-white" : "text-zinc-950")}>
          {displayTitle}
        </HeroTitle>
      </div>
      <div className="relative z-10 mx-auto mt-8 grid w-full max-w-5xl grid-cols-3 auto-rows-[minmax(72px,1fr)] gap-2 sm:auto-rows-[minmax(96px,1fr)] sm:gap-3">
        {cells.map((cell, i) => (
          <button
            key={i}
            type="button"
            onClick={onCoverClick}
            className={cn(
              "relative min-h-[72px] overflow-hidden rounded-xl border border-white/10 bg-zinc-800/80 transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
              cell.className,
            )}
            aria-label={i === 0 ? "View cover image full screen" : undefined}
          >
            <CoverImage
              src={coverImageUrl}
              alt=""
              className="object-cover"
              style={{ objectPosition: cell.pos }}
              sizes={i === 0 ? "(max-width: 1024px) 66vw, 480px" : "(max-width: 1024px) 33vw, 200px"}
              priority={i === 0}
            />
          </button>
        ))}
      </div>
      <div className="relative z-10 mx-auto mt-10 flex flex-col items-center gap-6">
        {selectionLocked ? <SelectionLockedBanner /> : null}
        <ViewGalleryCta
          buttonClassName={
            lightText
              ? "border-white text-white hover:bg-white/10"
              : "border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white"
          }
        />
      </div>
    </section>
  );
}

function OverlayHero(props: GalleryCoverHeroProps) {
  const { coverImageUrl, objectPosition, displayTitle, heroBrandLabel, selectionLocked, onCoverClick } =
    props;
  return (
    <section
      className="relative isolate flex min-h-[85svh] min-h-[85dvh] w-full flex-col justify-end overflow-hidden"
      aria-label={galleryCoverFrameLabel("overlay")}
    >
      <CoverImage
        src={coverImageUrl}
        alt={displayTitle ? `Cover — ${displayTitle}` : "Gallery cover"}
        className="absolute inset-0 object-cover"
        style={objectPosition}
        sizes="100vw"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: coverGradientToTop(resolveCoverTheme(props.coverColor).color) }}
        aria-hidden
      />
      <button
        type="button"
        onClick={onCoverClick}
        className="absolute inset-0 z-[5] cursor-zoom-in bg-transparent"
        aria-label="View cover image full screen"
      />
      <div className="relative z-10 px-6 pb-14 pt-24 text-white sm:px-10 sm:pb-16 lg:px-12">
        {heroBrandLabel ? (
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-white/70">{heroBrandLabel}</p>
        ) : null}
        <HeroTitle className="mt-4 text-white">{displayTitle}</HeroTitle>
        {selectionLocked ? <SelectionLockedBanner className="mt-6" /> : null}
        <ViewGalleryCta className="mt-8" buttonClassName="border-white text-white hover:bg-white/10" />
      </div>
    </section>
  );
}

function ParallaxHero(props: GalleryCoverHeroProps) {
  const { coverImageUrl, objectPosition, displayTitle, heroBrandLabel, selectionLocked, onCoverClick } =
    props;
  const bgStyle = useMemo(
    () => ({
      backgroundImage: `url(${coverImageUrl})`,
      backgroundPosition: objectPosition.objectPosition.replace(" ", " "),
      backgroundSize: "cover",
      backgroundAttachment: "fixed" as const,
    }),
    [coverImageUrl, objectPosition.objectPosition],
  );
  return (
    <section
      className="relative isolate flex min-h-[100svh] min-h-[100dvh] w-full flex-col"
      aria-label={galleryCoverFrameLabel("parallax")}
    >
      <div className="absolute inset-0 scale-105" style={bgStyle} aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: coverColorWithAlpha(resolveCoverTheme(props.coverColor).color, 0.5) }}
        aria-hidden
      />
      <button
        type="button"
        onClick={onCoverClick}
        className="absolute inset-0 z-[5] cursor-zoom-in bg-transparent"
        aria-label="View cover image full screen"
      />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-20 text-center text-white">
        {heroBrandLabel ? (
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-white/70">{heroBrandLabel}</p>
        ) : null}
        <HeroTitle className="mt-4 text-white">{displayTitle}</HeroTitle>
        {selectionLocked ? <SelectionLockedBanner className="mt-6" /> : null}
        <ViewGalleryCta className="mt-10" buttonClassName="border-white text-white hover:bg-white/10" />
      </div>
    </section>
  );
}

function HeroCarouselHero(props: GalleryCoverHeroProps) {
  const { coverImageUrl, objectPosition, displayTitle, heroBrandLabel, selectionLocked, onCoverClick } =
    props;
  const slides = useMemo(
    () => [
      { pos: objectPosition.objectPosition },
      { pos: "72% 38%" },
      { pos: "28% 62%" },
    ],
    [objectPosition.objectPosition],
  );
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const { color, lightText } = resolveCoverTheme(props.coverColor);
  return (
    <section
      className={cn(
        "relative isolate flex min-h-[100svh] min-h-[100dvh] w-full flex-col overflow-hidden",
        lightText ? "text-white" : "text-zinc-950",
      )}
      style={coverBackdropStyle(color)}
      aria-label={galleryCoverFrameLabel("hero-carousel")}
      aria-roledescription="carousel"
    >
      <div className="relative flex-1">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              i === active ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            aria-hidden={i !== active}
          >
            <CoverImage
              src={coverImageUrl}
              alt={i === active && displayTitle ? `Cover — ${displayTitle}` : ""}
              className="object-cover"
              style={{ objectPosition: slide.pos }}
              sizes="100vw"
              priority={i === 0}
            />
          </div>
        ))}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: coverColorWithAlpha(color, 0.4) }}
        />
        <button
          type="button"
          onClick={onCoverClick}
          className="absolute inset-0 z-[5] cursor-zoom-in bg-transparent"
          aria-label="View cover image full screen"
        />
      </div>
      <div className="relative z-10 px-6 pb-12 pt-6 text-center sm:pb-14">
        {heroBrandLabel ? (
          <p
            className={cn(
              "text-[10px] font-medium uppercase tracking-[0.35em]",
              lightText ? "text-white/70" : "text-zinc-600",
            )}
          >
            {heroBrandLabel}
          </p>
        ) : null}
        <HeroTitle className={cn("mx-auto mt-3", lightText ? "text-white" : "text-zinc-950")}>
          {displayTitle}
        </HeroTitle>
        <div className="mt-5 flex justify-center gap-2" role="tablist" aria-label="Cover slides">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                "h-2 w-2 rounded-full transition",
                i === active ? "bg-white" : "bg-white/35 hover:bg-white/55",
              )}
            />
          ))}
        </div>
        {selectionLocked ? <SelectionLockedBanner className="mx-auto mt-6" /> : null}
        <ViewGalleryCta
          className="mt-8"
          buttonClassName={
            lightText
              ? "border-white text-white hover:bg-white/10"
              : "border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white"
          }
        />
      </div>
    </section>
  );
}

function FramedHero(props: GalleryCoverHeroProps) {
  const {
    coverImageUrl,
    coverColor,
    coverFrame,
    objectPosition,
    displayTitle,
    heroBrandLabel,
    selectionLocked,
    onCoverClick,
  } = props;

  const isCard = coverFrame === "editorial-card" || coverFrame === "card-based";
  const isFilm = coverFrame === "film-border";
  const isSplit = coverFrame === "split-feature";
  const { color, lightText } = resolveCoverTheme(coverColor);
  const onLightBackdrop = isCard && !lightText;

  return (
    <section
      className={cn(
        "relative isolate min-h-[100svh] min-h-[100dvh] overflow-hidden",
        lightText && !onLightBackdrop ? "text-white" : "text-zinc-950 dark:text-white",
        onLightBackdrop && "text-zinc-950",
      )}
      style={coverBackdropStyle(color)}
      aria-label={galleryCoverFrameLabel(coverFrame)}
    >
      <CoverImage
        src={coverImageUrl}
        alt=""
        className={cn(
          "absolute inset-0 object-cover opacity-20 blur-2xl scale-105",
          isCard && "opacity-30 dark:opacity-20",
        )}
        style={objectPosition}
        sizes="100vw"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isCard
            ? `linear-gradient(to bottom right, ${coverColorWithAlpha(color, onLightBackdrop ? 0.35 : 0.9)}, ${coverColorWithAlpha(color, onLightBackdrop ? 0.2 : 0.55)}, ${coverColorWithAlpha(color, onLightBackdrop ? 0.45 : 0.88)})`
            : coverGradientDiagonal(color),
        }}
        aria-hidden
      />
      <div
        className={cn(
          "relative z-10 mx-auto flex min-h-[100svh] min-h-[100dvh] w-full max-w-6xl flex-col px-4 py-8 sm:px-8 lg:px-12",
          isSplit
            ? "justify-center gap-8 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center"
            : "items-center justify-center gap-7 text-center",
        )}
      >
        <div
          className={cn(
            "order-2 max-w-3xl",
            isSplit && "lg:order-1 lg:text-left lg:rounded-2xl lg:p-8",
          )}
          style={isSplit ? coverBackdropStyle(color) : undefined}
        >
          {heroBrandLabel ? (
            <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.35em] opacity-70 sm:text-[11px]">
              {heroBrandLabel}
            </p>
          ) : null}
          <HeroTitle
            className={cn(
              onLightBackdrop || (!lightText && isCard)
                ? "text-zinc-950 dark:text-white"
                : lightText
                  ? "text-white"
                  : "text-zinc-950",
            )}
          >
            {displayTitle}
          </HeroTitle>
          {selectionLocked ? (
            <SelectionLockedBanner className={cn("mx-auto mt-6 lg:mx-0", isCard && "dark:text-amber-100")} />
          ) : null}
          <ViewGalleryCta
            className="mt-8"
            buttonClassName={
              onLightBackdrop || (!lightText && isCard)
                ? "border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-zinc-950"
                : lightText
                  ? "border-white text-white hover:bg-white/10"
                  : "border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white"
            }
          />
        </div>

        <button
          type="button"
          onClick={onCoverClick}
          className={cn(
            "relative order-1 block overflow-hidden text-left shadow-2xl transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
            isCard &&
              "aspect-[16/10] w-full max-w-4xl rounded-[2rem] border border-white/70 bg-white p-2 shadow-zinc-900/20 dark:border-white/15 dark:bg-white/10",
            isFilm &&
              "aspect-[4/3] w-full max-w-3xl rounded-sm border-[12px] border-white bg-white shadow-black/50 sm:border-[18px]",
            isSplit &&
              "aspect-[4/5] w-full max-w-md rounded-[2rem] border border-white/15 bg-white/10 shadow-black/40 lg:order-2 lg:max-w-xl",
          )}
          aria-label="View cover image full screen"
        >
          <CoverImage
            src={coverImageUrl}
            alt={displayTitle ? `Cover — ${displayTitle}` : "Gallery cover"}
            className={cn("object-cover", isCard && "rounded-[1.5rem]")}
            style={objectPosition}
            sizes={isSplit ? "(max-width: 1024px) 90vw, 48vw" : "90vw"}
          />
        </button>
      </div>
    </section>
  );
}

export function GalleryCoverHero(props: GalleryCoverHeroProps) {
  switch (props.coverFrame) {
    case "cinematic":
      return <CinematicHero {...props} />;
    case "collage":
      return <CollageHero {...props} />;
    case "minimal":
      return <MinimalHero {...props} />;
    case "bento":
      return <BentoHero {...props} />;
    case "overlay":
      return <OverlayHero {...props} />;
    case "parallax":
      return <ParallaxHero {...props} />;
    case "hero-carousel":
      return <HeroCarouselHero {...props} />;
    case "full-bleed":
      return <FullBleedHero {...props} />;
    default:
      if (isFramedGalleryCoverFrame(props.coverFrame)) {
        return <FramedHero {...props} />;
      }
      return <FullBleedHero {...props} />;
  }
}
