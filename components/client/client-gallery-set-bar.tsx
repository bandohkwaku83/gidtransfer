"use client";

import { useMemo } from "react";
import type { ApiGallerySet } from "@/lib/gallery-sets-api";
import {
  ALL_SETS_PILL_ID,
  buildSetsBarOrder,
  countMediaByGallerySet,
  type GallerySetFilter,
  resolveAllSetsLabel,
  sortGallerySets,
} from "@/lib/gallery-set-filter";
import { cn } from "@/lib/utils";

type ClientGallerySetBarProps = {
  sets: ApiGallerySet[];
  allSetsLabel?: string | null;
  allSetsSortOrder?: number | null;
  filter: GallerySetFilter;
  onFilterChange: (filter: GallerySetFilter) => void;
  items: { setId?: string | null }[];
  className?: string;
};

export function ClientGallerySetBar({
  sets,
  allSetsLabel,
  allSetsSortOrder,
  filter,
  onFilterChange,
  items,
  className,
}: ClientGallerySetBarProps) {
  const sorted = useMemo(() => sortGallerySets(sets), [sets]);
  const allLabel = resolveAllSetsLabel(allSetsLabel);
  const pillOrder = useMemo(
    () => buildSetsBarOrder(sorted, allSetsSortOrder),
    [sorted, allSetsSortOrder],
  );
  const setsById = useMemo(() => {
    const map = new Map<string, ApiGallerySet>();
    for (const set of sorted) map.set(set.id, set);
    return map;
  }, [sorted]);
  const counts = countMediaByGallerySet(items);

  if (sorted.length === 0) return null;

  function pillClass(active: boolean) {
    return cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition sm:px-3",
      active
        ? "bg-brand text-white shadow-sm"
        : "text-zinc-600 hover:bg-white hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
    );
  }

  function countBadge(active: boolean, count: number) {
    return (
      <span
        className={cn(
          "inline-flex min-w-[1.15rem] items-center justify-center rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums leading-none",
          active
            ? "bg-white/20 text-white"
            : "bg-zinc-200/80 text-zinc-600 dark:bg-zinc-700/80 dark:text-zinc-300",
        )}
      >
        {count}
      </span>
    );
  }

  return (
    <div className={cn("min-h-[2.5rem] py-0.5", className)}>
      <div className="min-w-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          role="tablist"
          aria-label="Gallery sets"
          className="inline-flex gap-0.5 rounded-lg bg-zinc-100/90 p-0.5 dark:bg-zinc-900/50"
        >
          {pillOrder.map((id) => {
            if (id === ALL_SETS_PILL_ID) {
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filter === "all"}
                  className={pillClass(filter === "all")}
                  onClick={() => onFilterChange("all")}
                >
                  {allLabel}
                  {countBadge(filter === "all", counts.all)}
                </button>
              );
            }
            const set = setsById.get(id);
            if (!set) return null;
            const active = filter === set.id;
            const count = counts.bySet[set.id] ?? 0;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                className={pillClass(active)}
                onClick={() => onFilterChange(set.id)}
              >
                <span className="max-w-[8rem] truncate">{set.name}</span>
                {countBadge(active, count)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
