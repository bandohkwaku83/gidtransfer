"use client";

import { useCallback, useRef, useState } from "react";
import { Crop } from "lucide-react";
import type { WatermarkLogoCrop } from "@/lib/watermark-brand";
import { cn } from "@/lib/utils";

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

type Props = {
  logoDataUrl: string;
  crop: WatermarkLogoCrop | null;
  onCropChange: (crop: WatermarkLogoCrop) => void;
  disabled?: boolean;
};

export function LogoCropEditor({ logoDataUrl, crop, onCropChange, disabled }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [imgSize, setImgSize] = useState({ w: 1, h: 1 });
  const dragRef = useRef<{
    mode: "move" | "resize-br";
    startX: number;
    startY: number;
    startCrop: WatermarkLogoCrop;
  } | null>(null);

  const activeCrop: WatermarkLogoCrop = crop ?? { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };

  const onPointerDown = useCallback(
    (e: React.PointerEvent, mode: "move" | "resize-br") => {
      if (disabled) return;
      const el = frameRef.current;
      if (!el) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      dragRef.current = {
        mode,
        startX: e.clientX,
        startY: e.clientY,
        startCrop: { ...activeCrop },
      };
    },
    [disabled, activeCrop],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      const el = frameRef.current;
      if (!d || !el || disabled) return;
      const rect = el.getBoundingClientRect();
      const dx = (e.clientX - d.startX) / rect.width;
      const dy = (e.clientY - d.startY) / rect.height;
      const sc = d.startCrop;

      if (d.mode === "move") {
        const nx = clamp01(sc.x + dx);
        const ny = clamp01(sc.y + dy);
        onCropChange({
          x: Math.min(nx, 1 - sc.w),
          y: Math.min(ny, 1 - sc.h),
          w: sc.w,
          h: sc.h,
        });
        return;
      }

      const nw = clamp01(Math.max(0.12, sc.w + dx));
      const nh = clamp01(Math.max(0.12, sc.h + dy));
      onCropChange({
        x: sc.x,
        y: sc.y,
        w: Math.min(nw, 1 - sc.x),
        h: Math.min(nh, 1 - sc.y),
      });
    },
    [disabled, onCropChange],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  const boxStyle = {
    left: `${activeCrop.x * 100}%`,
    top: `${activeCrop.y * 100}%`,
    width: `${activeCrop.w * 100}%`,
    height: `${activeCrop.h * 100}%`,
  };

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
        <Crop className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Drag the box to move your logo. Pull the corner dot to resize.
      </p>
      <div
        ref={frameRef}
        className={cn(
          "relative mx-auto max-w-xs overflow-hidden rounded-xl border border-zinc-200 bg-[repeating-conic-gradient(#e4e4e7_0%_25%,#fafafa_0%_50%)] bg-[length:16px_16px] dark:border-zinc-700 dark:bg-[repeating-conic-gradient(#3f3f46_0%_25%,#27272a_0%_50%)]",
          disabled && "pointer-events-none opacity-60",
        )}
        style={{ aspectRatio: `${imgSize.w} / ${imgSize.h}` }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoDataUrl}
          alt="Logo to crop"
          className="block h-auto w-full select-none"
          draggable={false}
          onLoad={(e) => {
            const t = e.currentTarget;
            setImgSize({ w: t.naturalWidth, h: t.naturalHeight });
          }}
        />
        <div
          className="absolute border-2 border-brand bg-brand/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]"
          style={boxStyle}
          onPointerDown={(e) => onPointerDown(e, "move")}
        >
          <span
            className="absolute -bottom-1 -right-1 h-4 w-4 cursor-se-resize rounded-sm border-2 border-white bg-brand shadow"
            onPointerDown={(e) => {
              e.stopPropagation();
              onPointerDown(e, "resize-br");
            }}
          />
        </div>
      </div>
    </div>
  );
}
