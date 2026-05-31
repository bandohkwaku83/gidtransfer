"use client";

import { useMemo, useState } from "react";
import { Dropdown, type MenuProps } from "antd";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import type { ApiGallerySet } from "@/lib/gallery-sets-api";
import {
  countMediaByGallerySet,
  type GallerySetFilter,
  sortGallerySets,
} from "@/lib/gallery-set-filter";
import { FormInput } from "@/components/ui/form-input";
import { cn } from "@/lib/utils";

type GallerySetBarProps = {
  sets: ApiGallerySet[];
  filter: GallerySetFilter;
  onFilterChange: (filter: GallerySetFilter) => void;
  items: { setId?: string | null }[];
  onCreateSet: (name: string) => Promise<void>;
  onRenameSet?: (setId: string, name: string) => Promise<void>;
  onDeleteSet?: (setId: string) => Promise<void>;
  busy?: boolean;
  countContext?: string;
  showUploadHint?: boolean;
  className?: string;
};

export function GallerySetBar({
  sets,
  filter,
  onFilterChange,
  items,
  onCreateSet,
  onRenameSet,
  onDeleteSet,
  busy = false,
  countContext,
  showUploadHint = false,
  className,
}: GallerySetBarProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const sorted = sortGallerySets(sets);
  const counts = countMediaByGallerySet(items);
  const activeSet =
    filter !== "all" ? sorted.find((s) => s.id === filter) : undefined;

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || saving) return;
    setSaving(true);
    try {
      await onCreateSet(name);
      setNewName("");
      setCreating(false);
    } finally {
      setSaving(false);
    }
  }

  async function submitRename(setId: string) {
    const name = editName.trim();
    if (!name || !onRenameSet || saving) return;
    setSaving(true);
    try {
      await onRenameSet(setId, name);
      setEditingId(null);
      setEditName("");
    } finally {
      setSaving(false);
    }
  }

  const manageMenuItems = useMemo<MenuProps["items"]>(() => {
    if (!activeSet) return [];
    const menu: NonNullable<MenuProps["items"]> = [];
    if (onRenameSet) {
      menu.push({
        key: "rename",
        label: "Rename",
        icon: <Pencil className="h-3.5 w-3.5" />,
        onClick: () => {
          setEditingId(activeSet.id);
          setEditName(activeSet.name);
          setCreating(false);
        },
      });
    }
    if (onDeleteSet) {
      menu.push({
        key: "delete",
        label: "Delete",
        danger: true,
        icon: <Trash2 className="h-3.5 w-3.5" />,
        onClick: () => void onDeleteSet(activeSet.id),
      });
    }
    return menu;
  }, [activeSet, onRenameSet, onDeleteSet]);

  function segmentClass(active: boolean) {
    return cn(
      "shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition",
      active
        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200",
    );
  }

  const setsTitle = countContext
    ? `Sets (counts for ${countContext})`
    : "Sets";

  if (creating || editingId) {
    const isRename = Boolean(editingId);
    return (
      <form
        className={cn(
          "flex min-h-[2.25rem] flex-wrap items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-950",
          className,
        )}
        onSubmit={(e) => {
          e.preventDefault();
          if (isRename && editingId) void submitRename(editingId);
          else void submitCreate(e);
        }}
      >
        <span className="shrink-0 text-[11px] font-semibold text-zinc-500">
          {isRename ? "Rename" : "New set"}
        </span>
        <FormInput
          autoFocus
          size="small"
          value={isRename ? editName : newName}
          onChange={(e) =>
            isRename ? setEditName(e.target.value) : setNewName(e.target.value)
          }
          placeholder="Ceremony, Reception…"
          maxLength={80}
          disabled={saving}
          className="min-w-0 flex-1"
          aria-label={isRename ? "Set name" : "New set name"}
        />
        <button
          type="submit"
          disabled={saving || !(isRename ? editName : newName).trim()}
          className="rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
        >
          {isRename ? "Save" : "Add"}
        </button>
        <button
          type="button"
          disabled={saving}
          className="rounded-md px-2 py-1 text-[11px] text-zinc-500"
          onClick={() => {
            setCreating(false);
            setEditingId(null);
            setNewName("");
            setEditName("");
          }}
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-[2.25rem] items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-950",
        className,
      )}
      title={setsTitle}
    >
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Sets
      </span>

      {sorted.length === 0 ? (
        <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-400 dark:text-zinc-500">
          Add a set to organize uploads
        </span>
      ) : (
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div
            role="tablist"
            aria-label="Gallery sets"
            className="inline-flex gap-0.5 rounded-lg bg-zinc-100/90 p-0.5 dark:bg-zinc-900/90"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filter === "all"}
              disabled={busy}
              className={segmentClass(filter === "all")}
              onClick={() => onFilterChange("all")}
            >
              All
              <span className="ml-1 tabular-nums opacity-60">{counts.all}</span>
            </button>
            {sorted.map((set) => {
              const active = filter === set.id;
              const count = counts.bySet[set.id] ?? 0;
              return (
                <button
                  key={set.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  disabled={busy}
                  className={segmentClass(active)}
                  onClick={() => onFilterChange(set.id)}
                >
                  <span className="max-w-[7rem] truncate">{set.name}</span>
                  <span className="ml-1 tabular-nums opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showUploadHint && filter === "all" && sorted.length > 0 ? (
        <span className="hidden shrink-0 text-[10px] text-amber-700 dark:text-amber-300/90 lg:inline">
          Pick a set to upload
        </span>
      ) : null}

      {activeSet && manageMenuItems && manageMenuItems.length > 0 ? (
        <Dropdown menu={{ items: manageMenuItems }} trigger={["click"]} disabled={busy}>
          <button
            type="button"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
            aria-label={`Manage ${activeSet.name}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </Dropdown>
      ) : null}

      <button
        type="button"
        disabled={busy || saving}
        onClick={() => setCreating(true)}
        className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">Add</span>
      </button>
    </div>
  );
}
