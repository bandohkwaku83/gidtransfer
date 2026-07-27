"use client";

import { useEffect, useRef } from "react";
import { isDashPlaybackReady, type DashStatus } from "@/lib/gallery-media-streaming";

type DashPlayerHandle = {
  reset: () => void;
  destroy?: () => void;
};

type DashOrNativeVideoProps = {
  /** Progressive download URL (master) — used when DASH is unavailable. */
  src: string;
  poster?: string;
  dashUrl?: string;
  dashStatus?: DashStatus;
  className?: string;
  controls?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  preload?: "none" | "metadata" | "auto";
  autoPlay?: boolean;
  "aria-label"?: string;
  onContextMenu?: (e: React.MouseEvent<HTMLVideoElement>) => void;
};

/**
 * Adaptive MPEG-DASH via dashjs when `dashUrl` + `dashStatus === "ready"`,
 * otherwise progressive `<video src>`. Always applies `poster` when set.
 */
export function DashOrNativeVideo({
  src,
  poster,
  dashUrl,
  dashStatus,
  className,
  controls = true,
  muted,
  playsInline = true,
  preload = "metadata",
  autoPlay = false,
  "aria-label": ariaLabel,
  onContextMenu,
}: DashOrNativeVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<DashPlayerHandle | null>(null);
  const useDash = isDashPlaybackReady({ dashUrl, dashStatus });

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    let cancelled = false;

    const tearDown = () => {
      const player = playerRef.current;
      playerRef.current = null;
      if (!player) return;
      try {
        player.reset();
      } catch {
        /* ignore */
      }
      try {
        player.destroy?.();
      } catch {
        /* ignore */
      }
    };

    async function attach() {
      tearDown();
      if (cancelled || !videoRef.current) return;

      if (useDash && dashUrl) {
        try {
          const dashjs = await import("dashjs");
          if (cancelled || !videoRef.current) return;
          const MediaPlayer =
            dashjs.MediaPlayer ??
            (dashjs as { default?: typeof dashjs }).default?.MediaPlayer;
          if (!MediaPlayer) throw new Error("dashjs MediaPlayer missing");
          const player = MediaPlayer().create();
          player.initialize(videoRef.current, dashUrl, autoPlay);
          playerRef.current = player;
          return;
        } catch {
          /* fall through to progressive */
        }
      }

      if (cancelled || !videoRef.current) return;
      videoRef.current.removeAttribute("src");
      if (src) {
        videoRef.current.src = src;
        if (autoPlay) {
          void videoRef.current.play().catch(() => {});
        }
      }
    }

    void attach();

    return () => {
      cancelled = true;
      tearDown();
    };
  }, [useDash, dashUrl, src, autoPlay]);

  return (
    <video
      ref={videoRef}
      {...(poster ? { poster } : {})}
      controls={controls}
      muted={muted}
      playsInline={playsInline}
      preload={preload}
      aria-label={ariaLabel}
      className={className}
      onContextMenu={onContextMenu}
    />
  );
}
