"use client";

import {
  coverBackdropStyle,
  coverColorUsesLightText,
  coverColorWithAlpha,
  coverGradientToTop,
  normalizeGalleryCoverColor,
} from "@/lib/gallery-cover-color";
import {
  galleryCoverFrameLabel,
  isFramedGalleryCoverFrame,
  type GalleryCoverFrame,
} from "@/lib/gallery-cover-frame";
import { cn } from "@/lib/utils";

type GalleryCoverHeroPreviewProps = {
  coverSrc: string;
  hasCover: boolean;
  title: string;
  eventDateLabel: string;
  studioName: string;
  coverFrame: GalleryCoverFrame;
  coverColor?: string;
  focalX: number;
  focalY: number;
  /** Photographer preview — applied on dashboard customize panel only. */
  titleFont?: string;
  bodyFont?: string;
};

function previewFontStack(name: string | undefined, fallback: string): string | undefined {
  if (!name?.trim()) return undefined;
  return `"${name.trim()}", ${fallback}`;
}

function PreviewImg({
  src,
  focalX,
  focalY,
  className,
}: {
  src: string;
  focalX: number;
  focalY: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
      style={{ objectPosition: `${focalX}% ${focalY}%` }}
    />
  );
}

function PreviewPlaceholder() {
  return <div className="absolute inset-0 bg-zinc-800" />;
}

export function GalleryCoverHeroPreview({
  coverSrc,
  hasCover,
  title,
  eventDateLabel,
  studioName,
  coverFrame,
  coverColor,
  focalX,
  focalY,
  titleFont,
  bodyFont,
}: GalleryCoverHeroPreviewProps) {
  const backdrop = normalizeGalleryCoverColor(coverColor);
  const lightText = coverColorUsesLightText(backdrop);
  const barStyle = coverBackdropStyle(backdrop);
  const locationLine = "YOUR LOCATION";
  const titleFamily = previewFontStack(titleFont, "serif");
  const bodyFamily = previewFontStack(bodyFont, "sans-serif");
  const img = hasCover ? (
    <PreviewImg src={coverSrc} focalX={focalX} focalY={focalY} />
  ) : (
    <PreviewPlaceholder />
  );

  const titleBlock = (
    <>
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/70"
        style={bodyFamily ? { fontFamily: bodyFamily } : undefined}
      >
        {studioName}
      </p>
      <h2
        className="mt-3 font-serif text-2xl font-medium tracking-tight sm:text-3xl"
        style={titleFamily ? { fontFamily: titleFamily } : undefined}
      >
        {title}
      </h2>
      <p
        className="mt-2 text-[10px] font-medium uppercase tracking-widest text-white/70"
        style={bodyFamily ? { fontFamily: bodyFamily } : undefined}
      >
        {eventDateLabel} · {locationLine}
      </p>
      <span
        className="mt-5 inline-flex border border-white/85 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
        style={bodyFamily ? { fontFamily: bodyFamily } : undefined}
      >
        Enter gallery
      </span>
    </>
  );

  if (coverFrame === "minimal") {
    return (
      <div className="relative flex min-h-[280px] flex-col items-center justify-center bg-white px-6 py-10 text-center text-zinc-950 dark:bg-zinc-950 dark:text-white">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-400"
          style={bodyFamily ? { fontFamily: bodyFamily } : undefined}
        >
          {studioName}
        </p>
        <h2
          className="mt-2 font-serif text-2xl font-medium tracking-tight"
          style={titleFamily ? { fontFamily: titleFamily } : undefined}
        >
          {title}
        </h2>
        <div className="relative mt-5 aspect-[3/4] w-full max-w-[200px] overflow-hidden rounded-sm shadow-md">
          {hasCover ? (
            <PreviewImg src={coverSrc} focalX={focalX} focalY={focalY} />
          ) : (
            <PreviewPlaceholder />
          )}
        </div>
      </div>
    );
  }

  if (coverFrame === "cinematic") {
    return (
      <div
        className={cn("relative flex min-h-[280px] flex-col", lightText ? "text-white" : "text-zinc-950")}
        style={barStyle}
      >
        <div className="h-6 shrink-0" style={barStyle} />
        <div className="relative mx-3 aspect-[21/9] overflow-hidden rounded-sm">
          {img}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: coverColorWithAlpha(backdrop, 0.3) }}
          />
        </div>
        <div className="h-6 shrink-0" style={barStyle} />
        <div className="px-6 py-4 text-center">{titleBlock}</div>
      </div>
    );
  }

  if (coverFrame === "collage") {
    return (
      <div
        className={cn(
          "relative min-h-[300px] overflow-hidden px-4 py-8 text-center",
          lightText ? "text-white" : "text-zinc-950",
        )}
        style={barStyle}
      >
        <h2
          className="font-serif text-xl font-medium"
          style={titleFamily ? { fontFamily: titleFamily } : undefined}
        >
          {title}
        </h2>
        <div className="relative mx-auto mt-6 aspect-[4/3] max-w-md">
          {hasCover ? (
            <>
              <div className="absolute left-[4%] top-[10%] z-20 h-[42%] w-[38%] -rotate-6 overflow-hidden rounded-xl border border-white/20 shadow-lg">
                <PreviewImg src={coverSrc} focalX={30} focalY={40} />
              </div>
              <div className="absolute right-[6%] top-[8%] z-30 h-[48%] w-[40%] rotate-5 overflow-hidden rounded-xl border border-white/20 shadow-lg">
                <PreviewImg src={coverSrc} focalX={70} focalY={25} />
              </div>
              <div className="absolute bottom-[12%] left-[18%] z-10 h-[38%] w-[44%] rotate-2 overflow-hidden rounded-xl border border-white/20 opacity-90">
                <PreviewImg src={coverSrc} focalX={50} focalY={75} />
              </div>
            </>
          ) : (
            <PreviewPlaceholder />
          )}
        </div>
      </div>
    );
  }

  if (coverFrame === "bento") {
    return (
      <div
        className={cn("relative min-h-[300px] px-4 py-6", lightText ? "text-white" : "text-zinc-950")}
        style={barStyle}
      >
        <h2
          className="text-center font-serif text-xl font-medium"
          style={titleFamily ? { fontFamily: titleFamily } : undefined}
        >
          {title}
        </h2>
        <div className="mx-auto mt-4 grid max-w-md grid-cols-3 auto-rows-[56px] gap-1.5">
          {[
            "col-span-2 row-span-2",
            "",
            "",
            "col-span-2",
          ].map((cell, i) => (
            <div
              key={i}
              className={cn("relative overflow-hidden rounded-lg border border-white/10", cell)}
            >
              {hasCover ? (
                <PreviewImg
                  src={coverSrc}
                  focalX={focalX}
                  focalY={focalY}
                />
              ) : (
                <PreviewPlaceholder />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (coverFrame === "overlay") {
    return (
      <div className="relative min-h-[280px] overflow-hidden">
        {img}
        <div
          className="absolute inset-0"
          style={{ background: coverGradientToTop(backdrop) }}
        />
        <div className="relative flex min-h-[280px] flex-col justify-end px-6 py-8 text-white">
          {titleBlock}
        </div>
      </div>
    );
  }

  if (coverFrame === "parallax") {
    return (
      <div className="relative min-h-[280px] overflow-hidden">
        {img}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: coverColorWithAlpha(backdrop, 0.45) }}
        />
        <div className="relative flex min-h-[280px] flex-col items-center justify-center px-6 text-center text-white">
          {titleBlock}
        </div>
      </div>
    );
  }

  if (coverFrame === "hero-carousel") {
    return (
      <div
        className={cn("relative min-h-[280px] overflow-hidden", lightText ? "text-white" : "text-zinc-950")}
        style={barStyle}
      >
        <div className="relative min-h-[200px]">{img}</div>
        <div
          className="absolute inset-0"
          style={{ backgroundColor: coverColorWithAlpha(backdrop, 0.35) }}
        />
        <div className="relative px-6 py-5 text-center">
          {titleBlock}
          <div className="mt-3 flex justify-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    );
  }

  if (coverFrame === "split-feature") {
    return (
      <div className="grid min-h-[280px] md:grid-cols-2">
        <div
          className={cn("flex flex-col justify-center p-6", lightText ? "text-white" : "text-zinc-950")}
          style={barStyle}
        >
          {titleBlock}
        </div>
        <div className="relative min-h-[200px]">{img}</div>
      </div>
    );
  }

  if (isFramedGalleryCoverFrame(coverFrame)) {
    const onLightBackdrop =
      (coverFrame === "editorial-card" || coverFrame === "card-based") && !lightText;
    return (
      <div
        className={cn(
          "relative min-h-[280px] overflow-hidden p-4",
          onLightBackdrop ? "text-zinc-950" : lightText ? "text-white" : "text-zinc-950",
        )}
        style={barStyle}
      >
        <div
          className={cn(
            "relative mx-auto aspect-[16/10] max-w-lg overflow-hidden shadow-xl",
            coverFrame === "film-border" && "rounded-sm border-[8px] border-white",
            (coverFrame === "editorial-card" || coverFrame === "card-based") &&
              "rounded-2xl border border-white/80 p-1.5",
          )}
        >
          {img}
        </div>
        <div
          className={cn(
            "relative mt-4 px-4 text-center",
            onLightBackdrop ? "text-zinc-950" : "text-white",
          )}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.35em] opacity-60"
            style={bodyFamily ? { fontFamily: bodyFamily } : undefined}
          >
            {studioName}
          </p>
          <h2
            className="mt-2 font-serif text-xl font-medium"
            style={titleFamily ? { fontFamily: titleFamily } : undefined}
          >
            {title}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative min-h-[280px] overflow-hidden",
        lightText ? "text-white" : "text-zinc-950",
      )}
      style={barStyle}
      aria-label={galleryCoverFrameLabel(coverFrame)}
    >
      {img}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: coverColorWithAlpha(backdrop, 0.4) }}
        aria-hidden
      />
      <div className="relative flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center text-white">
        {titleBlock}
      </div>
    </div>
  );
}
