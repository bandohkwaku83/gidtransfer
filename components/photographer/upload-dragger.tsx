"use client";

import { Upload, type LucideIcon } from "lucide-react";
import { useCallback, useId, useRef, useState, type DragEvent } from "react";
import { collectFilesFromDataTransfer } from "@/lib/upload-folder-files";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  hint?: string;
  accept?: string;
  disabled?: boolean;
  /** Slim bar when the gallery already has uploads. */
  compact?: boolean;
  /** When true, dropped folders are expanded and their files uploaded individually. */
  allowDirectory?: boolean;
  /** Optional filter applied after files/folders are collected. */
  filterFile?: (file: File) => boolean;
  /** Called when files were found but none passed `filterFile`. */
  onFilteredEmpty?: () => void;
  /** Override the default upload icon. */
  icon?: LucideIcon;
  /** If set, click opens this instead of the file picker. Drop still uses onFiles. */
  onActivate?: () => void;
  onFiles: (files: File[]) => void;
};

export function UploadDragger({
  label = "Drag & drop images here",
  hint = "or click to browse — JPG, PNG, WebP, GIF",
  accept = "image/jpeg,image/png,image/webp,image/gif",
  disabled,
  compact = false,
  allowDirectory = false,
  filterFile,
  onFilteredEmpty,
  icon: Icon = Upload,
  onActivate,
  onFiles,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const emitFiles = useCallback(
    (files: File[]) => {
      if (disabled) return;
      const next = filterFile ? files.filter(filterFile) : files;
      if (files.length > 0 && next.length === 0) {
        onFilteredEmpty?.();
        return;
      }
      if (next.length === 0) return;
      onFiles(next);
    },
    [disabled, filterFile, onFilteredEmpty, onFiles],
  );

  const handleFileList = useCallback(
    (list: FileList | null) => {
      if (!list?.length || disabled) return;
      emitFiles(Array.from(list));
      if (inputRef.current) inputRef.current.value = "";
    },
    [disabled, emitFiles],
  );

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setOver(false);
      if (disabled) return;
      const files = allowDirectory
        ? await collectFilesFromDataTransfer(event.dataTransfer)
        : Array.from(event.dataTransfer.files);
      emitFiles(files);
    },
    [allowDirectory, disabled, emitFiles],
  );

  const shellClass = cn(
    "relative block w-full rounded-xl border border-dashed text-center transition",
    compact ? "px-4 py-4 sm:text-left" : "px-6 py-10",
    disabled
      ? "cursor-not-allowed border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
      : over
        ? "cursor-pointer border-brand bg-brand-soft dark:border-brand-on-dark dark:bg-brand/20"
        : "cursor-pointer border-zinc-200/90 bg-brand-soft/40 hover:border-brand/40 hover:bg-brand-soft/70 dark:border-zinc-700 dark:bg-brand/10 dark:hover:border-brand/35 dark:hover:bg-brand/15",
  );

  const inner = (
    <div
      className={cn(
        "pointer-events-none relative flex items-center justify-center gap-3",
        compact && "sm:justify-start",
      )}
    >
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-950 dark:ring-white/10",
          compact ? "h-9 w-9" : "h-11 w-11",
        )}
      >
        <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} strokeWidth={1.75} aria-hidden />
      </span>
      <div className={cn(compact ? "min-w-0 text-left" : "")}>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{hint}</p>
      </div>
    </div>
  );

  const dragHandlers = {
    onDragEnter: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      setOver(true);
    },
    onDragOver: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      setOver(true);
    },
    onDragLeave: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      if (e.currentTarget === e.target) setOver(false);
    },
    onDrop: handleDrop,
  };

  if (onActivate) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onActivate}
        className={shellClass}
        {...dragHandlers}
      >
        {inner}
      </button>
    );
  }

  return (
    <label htmlFor={inputId} className={shellClass} {...dragHandlers}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="sr-only"
        accept={accept}
        multiple
        disabled={disabled}
        onChange={(e) => handleFileList(e.target.files)}
      />
      {inner}
    </label>
  );
}
