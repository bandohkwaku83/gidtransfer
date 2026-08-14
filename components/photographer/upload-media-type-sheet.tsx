"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { ImageIcon, Lock, Video, X } from "lucide-react";
import {
  collectFilesFromDataTransfer,
  isPhotoUploadableFile,
  isVideoUploadableFile,
  PHOTO_UPLOAD_ACCEPT,
  VIDEO_UPLOAD_ACCEPT,
} from "@/lib/upload-folder-files";
import { cn } from "@/lib/utils";

type UploadKind = "photos" | "videos";

type Props = {
  open: boolean;
  onClose: () => void;
  disabled?: boolean;
  onPhotos: (files: File[]) => void;
  onVideos: (files: File[]) => void;
  onFilteredEmpty: (kind: UploadKind) => void;
  videoLocked?: boolean;
  onVideoLocked?: () => void;
};

export function UploadMediaTypeSheet({
  open,
  onClose,
  disabled,
  onPhotos,
  onVideos,
  onFilteredEmpty,
  videoLocked = false,
  onVideoLocked,
}: Props) {
  const titleId = useId();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const emit = useCallback(
    (kind: UploadKind, files: File[]) => {
      const filter = kind === "photos" ? isPhotoUploadableFile : isVideoUploadableFile;
      const next = files.filter(filter);
      if (files.length > 0 && next.length === 0) {
        onFilteredEmpty(kind);
        return;
      }
      if (next.length === 0) return;
      onClose();
      if (kind === "photos") onPhotos(next);
      else onVideos(next);
    },
    [onClose, onFilteredEmpty, onPhotos, onVideos],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md animate-[toast-enter_220ms_ease-out] rounded-t-3xl border border-zinc-200/80 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:rounded-3xl sm:px-6 sm:pb-6 sm:pt-5"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200 sm:hidden dark:bg-zinc-700" aria-hidden />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-display text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              What are you uploading?
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Photos and videos go to different places, so pick one to start.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2.5">
          <UploadKindOption
            icon={ImageIcon}
            title="Photos"
            hint="JPG, PNG, HEIC, and camera RAW"
            disabled={disabled}
            onPick={() => photoInputRef.current?.click()}
            onDropFiles={(files) => emit("photos", files)}
          />
          <UploadKindOption
            icon={Video}
            title="Videos"
            hint={
              videoLocked
                ? "Video uploads are on Basic, Pro, and Premium"
                : "MP4, MOV, WebM, and other video files"
            }
            disabled={disabled}
            locked={videoLocked}
            onPick={() => {
              if (videoLocked) {
                onVideoLocked?.();
                return;
              }
              videoInputRef.current?.click();
            }}
            onDropFiles={(files) => {
              if (videoLocked) {
                onVideoLocked?.();
                return;
              }
              emit("videos", files);
            }}
          />
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept={PHOTO_UPLOAD_ACCEPT}
          multiple
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            emit("photos", Array.from(e.target.files ?? []));
            e.currentTarget.value = "";
          }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept={VIDEO_UPLOAD_ACCEPT}
          multiple
          className="sr-only"
          disabled={disabled || videoLocked}
          onChange={(e) => {
            emit("videos", Array.from(e.target.files ?? []));
            e.currentTarget.value = "";
          }}
        />
      </div>
    </div>
  );
}

function UploadKindOption({
  icon: Icon,
  title,
  hint,
  disabled,
  locked,
  onPick,
  onDropFiles,
}: {
  icon: typeof ImageIcon;
  title: string;
  hint: string;
  disabled?: boolean;
  locked?: boolean;
  onPick: () => void;
  onDropFiles: (files: File[]) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        const files = await collectFilesFromDataTransfer(e.dataTransfer);
        onDropFiles(files);
      }}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3.5 text-left transition",
        "hover:border-brand/30 hover:bg-brand-soft/50",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-brand/35 dark:hover:bg-brand/10",
      )}
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-950 dark:ring-white/10">
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-zinc-500 dark:text-zinc-400">
          {hint}
        </span>
      </span>
      {locked ? (
        <Lock className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
      ) : null}
    </button>
  );
}
