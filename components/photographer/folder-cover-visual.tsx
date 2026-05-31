"use client";

import { ImageIcon } from "lucide-react";
import type { ApiFolder } from "@/lib/folders/types";
import {
  folderCoverObjectPositionStyle,
  folderCoverPlaceholderLabel,
  resolveFolderCoverSrc,
} from "@/lib/folders/helpers";
import { cn } from "@/lib/utils";

type FolderCoverVisualProps = {
  folder: ApiFolder;
  /** From settings when the gallery uses the studio default cover. */
  studioDefaultCoverUrl?: string | null;
  className?: string;
  imgClassName?: string;
};

export function FolderCoverVisual({
  folder,
  studioDefaultCoverUrl,
  className,
  imgClassName,
}: FolderCoverVisualProps) {
  const src = resolveFolderCoverSrc(folder, studioDefaultCoverUrl);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={imgClassName}
        style={folderCoverObjectPositionStyle(folder)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-200 px-4 text-center dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-800",
        className,
      )}
    >
      <ImageIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-600" aria-hidden />
      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
        {folderCoverPlaceholderLabel(folder)}
      </span>
    </div>
  );
}
