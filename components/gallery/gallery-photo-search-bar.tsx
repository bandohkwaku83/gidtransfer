"use client";

import { X } from "lucide-react";
import { FormSearchInput } from "@/components/ui/form-input";
import {
  GALLERY_PHOTO_MIN_QUALITY_PRESETS,
  GALLERY_PHOTO_SCENE_CHIPS,
  galleryPhotoSearchActive,
  type GalleryPhotoSearchFilters,
} from "@/lib/gallery-photo-search";
import { cn } from "@/lib/utils";

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition",
        active
          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
      )}
    >
      {label}
    </button>
  );
}

export function GalleryPhotoSearchBar({
  value,
  onChange,
  showAiFilters = false,
  searching = false,
  placeholder = "Search photos…",
  className,
}: {
  value: GalleryPhotoSearchFilters;
  onChange: (next: GalleryPhotoSearchFilters) => void;
  /** When false, only the text search box is shown (no scene / AI chips). */
  showAiFilters?: boolean;
  searching?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const active = galleryPhotoSearchActive(value);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <FormSearchInput
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
          placeholder={placeholder}
          allowClear
          className="min-w-[12rem] flex-1"
          aria-label="Search photos"
        />
        {searching ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Searching…</span>
        ) : null}
        {active ? (
          <button
            type="button"
            onClick={() =>
              onChange({
                q: "",
                scene: "",
                suggested: false,
                blurry: false,
                minQuality: null,
              })
            }
            className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Clear
          </button>
        ) : null}
      </div>

      {showAiFilters ? (
        <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible">
          <FilterChip
            active={value.suggested}
            onClick={() => onChange({ ...value, suggested: !value.suggested })}
            label="Suggested"
          />
          <FilterChip
            active={value.blurry}
            onClick={() => onChange({ ...value, blurry: !value.blurry })}
            label="Blurry"
          />
          {GALLERY_PHOTO_MIN_QUALITY_PRESETS.map((score) => (
            <FilterChip
              key={score}
              active={value.minQuality === score}
              onClick={() =>
                onChange({
                  ...value,
                  minQuality: value.minQuality === score ? null : score,
                })
              }
              label={`Quality ${score}+`}
            />
          ))}
          {GALLERY_PHOTO_SCENE_CHIPS.map((scene) => (
            <FilterChip
              key={scene}
              active={value.scene === scene}
              onClick={() =>
                onChange({
                  ...value,
                  scene: value.scene === scene ? "" : scene,
                })
              }
              label={scene.replace(/-/g, " ")}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
