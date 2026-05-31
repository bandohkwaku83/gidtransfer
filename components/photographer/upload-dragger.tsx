"use client";

import { Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  hint?: string;
  accept?: string;
  disabled?: boolean;
  /** Slim bar when the gallery already has uploads. */
  compact?: boolean;
  onFiles: (files: File[]) => void;
};

export function UploadDragger({
  label = "Drag & drop images here",
  hint = "or click to browse — JPG, PNG, WebP, GIF",
  accept = "image/jpeg,image/png,image/webp,image/gif",
  disabled,
  compact = false,
  onFiles,
}: Props) {
  const [over, setOver] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list?.length || disabled) return;
      onFiles(Array.from(list));
    },
    [disabled, onFiles],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          (e.target as HTMLElement).querySelector("input")?.click();
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        if (e.currentTarget === e.target) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "relative rounded-xl border border-dashed text-center transition",
        compact ? "px-4 py-4 sm:text-left" : "px-6 py-10",
        disabled
          ? "cursor-not-allowed border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
          : over
            ? "cursor-pointer border-brand bg-brand-soft dark:border-brand-on-dark dark:bg-brand/20"
            : "cursor-pointer border-zinc-200/90 bg-brand-soft/40 hover:border-brand/40 hover:bg-brand-soft/70 dark:border-zinc-700 dark:bg-brand/10 dark:hover:border-brand/35 dark:hover:bg-brand/15",
      )}
    >
      <input
        type="file"
        className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        accept={accept}
        multiple
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div
        className={cn(
          "relative flex items-center justify-center gap-3",
          compact && "sm:justify-start",
        )}
      >
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-950 dark:ring-white/10",
            compact ? "h-9 w-9" : "h-11 w-11",
          )}
        >
          <Upload className={compact ? "h-4 w-4" : "h-5 w-5"} strokeWidth={1.75} aria-hidden />
        </span>
        <div className={cn(compact ? "min-w-0 text-left" : "")}>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{hint}</p>
        </div>
      </div>
    </div>
  );
}
