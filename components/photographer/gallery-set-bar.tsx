"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Dropdown, type MenuProps } from "antd";
import { GripVertical, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import type { ApiGallerySet } from "@/lib/gallery-sets-api";
import {
  ALL_SETS_PILL_ID,
  buildSetsBarOrder,
  countMediaByGallerySet,
  type GallerySetFilter,
  resolveAllSetsLabel,
  sortGallerySets,
} from "@/lib/gallery-set-filter";
import { moveIdInList } from "@/lib/move-id-in-list";
import { FormInput } from "@/components/ui/form-input";
import { cn } from "@/lib/utils";

const DRAG_START_PX = 6;

type GallerySetBarProps = {
  sets: ApiGallerySet[];
  allSetsLabel?: string | null;
  allSetsSortOrder?: number | null;
  filter: GallerySetFilter;
  onFilterChange: (filter: GallerySetFilter) => void;
  items: { setId?: string | null }[];
  onCreateSet: (name: string) => Promise<void>;
  onRenameSet?: (setId: string, name: string) => Promise<void>;
  onRenameAllSets?: (label: string) => Promise<void>;
  onDeleteSet?: (setId: string) => Promise<void>;
  onReorderSets?: (orderedIds: string[]) => Promise<void>;
  busy?: boolean;
  countContext?: string;
  showUploadHint?: boolean;
  className?: string;
};

export function GallerySetBar({
  sets,
  allSetsLabel,
  allSetsSortOrder,
  filter,
  onFilterChange,
  items,
  onCreateSet,
  onRenameSet,
  onRenameAllSets,
  onDeleteSet,
  onReorderSets,
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

  const sorted = useMemo(() => sortGallerySets(sets), [sets]);
  const allLabel = resolveAllSetsLabel(allSetsLabel);
  const counts = countMediaByGallerySet(items);
  const activeSet =
    filter !== "all" ? sorted.find((s) => s.id === filter) : undefined;

  const pillRefs = useRef(new Map<string, HTMLSpanElement>());
  const pendingDragRef = useRef<{
    id: string;
    label: string;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null>(null);
  const activeDragRef = useRef<{
    id: string;
    label: string;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null>(null);
  const orderedIdsRef = useRef<string[]>([]);

  const canonicalOrder = useMemo(
    () => buildSetsBarOrder(sorted, allSetsSortOrder),
    [sorted, allSetsSortOrder],
  );

  const [orderedIds, setOrderedIds] = useState<string[]>(canonicalOrder);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [hoverId, setHoverId] = useState<string | null>(null);

  orderedIdsRef.current = orderedIds;

  useEffect(() => {
    if (draggingId) return;
    setOrderedIds((prev) => {
      if (
        prev.length === canonicalOrder.length &&
        prev.every((id, index) => id === canonicalOrder[index])
      ) {
        return prev;
      }
      return canonicalOrder;
    });
  }, [canonicalOrder, draggingId]);

  const setsById = useMemo(() => {
    const map = new Map<string, ApiGallerySet>();
    for (const set of sorted) map.set(set.id, set);
    return map;
  }, [sorted]);

  const hasSets = sorted.length > 0;
  const canReorder =
    Boolean(onReorderSets) &&
    hasSets &&
    orderedIds.length > 1 &&
    !creating &&
    !editingId &&
    !busy;

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

  async function submitRename(pillId: string) {
    const name = editName.trim();
    if (!name || saving) return;
    setSaving(true);
    try {
      if (pillId === ALL_SETS_PILL_ID) {
        if (!onRenameAllSets) return;
        await onRenameAllSets(name);
      } else if (onRenameSet) {
        await onRenameSet(pillId, name);
      } else {
        return;
      }
      setEditingId(null);
      setEditName("");
    } finally {
      setSaving(false);
    }
  }

  const startRenamePill = useCallback(
    (pillId: string, currentName: string) => {
      if (busy || saving) return;
      if (pillId === ALL_SETS_PILL_ID && !onRenameAllSets) return;
      if (pillId !== ALL_SETS_PILL_ID && !onRenameSet) return;
      setEditingId(pillId);
      setEditName(currentName);
      setCreating(false);
    },
    [busy, onRenameAllSets, onRenameSet, saving],
  );

  const manageMenuItems = useMemo<MenuProps["items"]>(() => {
    const menu: NonNullable<MenuProps["items"]> = [];
    if (filter === "all" && onRenameAllSets) {
      menu.push({
        key: "rename-all",
        label: "Rename",
        icon: <Pencil className="h-3.5 w-3.5" />,
        onClick: () => startRenamePill(ALL_SETS_PILL_ID, allLabel),
      });
      return menu;
    }
    if (!activeSet) return [];
    if (onRenameSet) {
      menu.push({
        key: "rename",
        label: "Rename",
        icon: <Pencil className="h-3.5 w-3.5" />,
        onClick: () => startRenamePill(activeSet.id, activeSet.name),
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
  }, [activeSet, allLabel, filter, onDeleteSet, onRenameAllSets, onRenameSet, startRenamePill]);

  const findHoverIndex = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const pill = el?.closest("[data-gallery-set-id]") as HTMLElement | null;
    const hoverPillId = pill?.dataset.gallerySetId;
    if (!hoverPillId) return -1;
    return orderedIdsRef.current.indexOf(hoverPillId);
  }, []);

  const beginDrag = useCallback(
    (
      id: string,
      label: string,
      offsetX: number,
      offsetY: number,
      width: number,
      height: number,
    ) => {
      activeDragRef.current = { id, label, offsetX, offsetY, width, height };
      setDraggingId(id);
      setHoverId(id);
    },
    [],
  );

  const endDrag = useCallback(() => {
    const drag = activeDragRef.current;
    pendingDragRef.current = null;
    activeDragRef.current = null;
    setDraggingId(null);
    setHoverId(null);

    if (!drag || !onReorderSets) return;

    const finalIds = orderedIdsRef.current;
    const changed =
      finalIds.length !== canonicalOrder.length ||
      finalIds.some((id, index) => id !== canonicalOrder[index]);

    if (changed) {
      void onReorderSets(finalIds);
    }
  }, [canonicalOrder, onReorderSets]);

  useEffect(() => {
    if (!draggingId) return;

    const onPointerMove = (event: PointerEvent) => {
      event.preventDefault();
      setGhostPos({ x: event.clientX, y: event.clientY });

      const drag = activeDragRef.current;
      if (!drag) return;

      const hoverIndex = findHoverIndex(event.clientX, event.clientY);
      if (hoverIndex < 0) return;

      const el = document.elementFromPoint(event.clientX, event.clientY);
      const pill = el?.closest("[data-gallery-set-id]") as HTMLElement | null;
      setHoverId(pill?.dataset.gallerySetId ?? null);

      setOrderedIds((prev) => {
        const next = moveIdInList(prev, drag.id, hoverIndex);
        if (next.join("|") === prev.join("|")) return prev;
        return next;
      });
    };

    const onPointerUp = () => {
      endDrag();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [draggingId, endDrag, findHoverIndex]);

  useEffect(() => {
    if (draggingId) return;

    const onPointerMove = (event: PointerEvent) => {
      const pending = pendingDragRef.current;
      if (!pending) return;

      const dx = event.clientX - pending.startX;
      const dy = event.clientY - pending.startY;
      if (Math.hypot(dx, dy) < DRAG_START_PX) return;

      pendingDragRef.current = null;
      beginDrag(
        pending.id,
        pending.label,
        pending.offsetX,
        pending.offsetY,
        pending.width,
        pending.height,
      );
    };

    const onPointerUp = () => {
      pendingDragRef.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [beginDrag, draggingId]);

  const armDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>, id: string, label: string) => {
      if (!canReorder) return;
      const pill = pillRefs.current.get(id);
      if (!pill) return;

      event.preventDefault();
      event.stopPropagation();

      const rect = pill.getBoundingClientRect();
      pendingDragRef.current = {
        id,
        label,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        width: rect.width,
        height: rect.height,
      };
    },
    [canReorder],
  );

  function pillClass(active: boolean, isDragging?: boolean) {
    return cn(
      "inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition sm:px-3",
      isDragging && "opacity-40",
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

  function renderPill(id: string, label: string, active: boolean, count: number) {
    const isDragging = draggingId === id;
    const isDropTarget = Boolean(
      hoverId && hoverId === id && draggingId && draggingId !== id,
    );
    const canRename =
      id === ALL_SETS_PILL_ID ? Boolean(onRenameAllSets) : Boolean(onRenameSet);

    return (
      <span
        key={id}
        ref={(node) => {
          if (node) pillRefs.current.set(id, node);
          else pillRefs.current.delete(id);
        }}
        data-gallery-set-id={id}
        className={cn(
          "inline-flex shrink-0 transition-transform duration-150 ease-out",
          isDropTarget && "scale-[0.97]",
        )}
      >
        <span className={pillClass(active, isDragging)}>
          {canReorder ? (
            <button
              type="button"
              className={cn(
                "-ml-0.5 inline-flex cursor-grab touch-none items-center rounded p-0.5 active:cursor-grabbing",
                active
                  ? "text-white/70 hover:text-white"
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
              )}
              aria-label={`Drag to reorder ${label}`}
              onPointerDown={(event) => armDrag(event, id, label)}
            >
              <GripVertical className="h-3 w-3" aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            role="tab"
            aria-selected={active}
            disabled={busy || Boolean(draggingId)}
            className="inline-flex min-w-0 items-center gap-1.5"
            title={canRename ? "Double-click to rename" : undefined}
            onClick={() => onFilterChange(id === ALL_SETS_PILL_ID ? "all" : id)}
            onDoubleClick={(event) => {
              event.preventDefault();
              startRenamePill(id, label);
            }}
          >
            <span className="max-w-[8rem] truncate">{label}</span>
            {countBadge(active, count)}
          </button>
        </span>
      </span>
    );
  }

  const setsTitle = countContext
    ? `Sets (counts for ${countContext})`
    : "Gallery sets";

  if (creating || editingId) {
    const isRename = Boolean(editingId);
    const isAllPill = editingId === ALL_SETS_PILL_ID;
    return (
      <form
        className={cn(
          "flex min-h-[2.5rem] flex-wrap items-center gap-2 py-1",
          className,
        )}
        onSubmit={(e) => {
          e.preventDefault();
          if (isRename && editingId) void submitRename(editingId);
          else void submitCreate(e);
        }}
      >
        <span className="shrink-0 text-[12px] font-medium text-zinc-600 dark:text-zinc-300">
          {isRename ? (isAllPill ? "Rename all tab" : "Rename set") : "New set"}
        </span>
        <FormInput
          autoFocus
          size="small"
          value={isRename ? editName : newName}
          onChange={(e) =>
            isRename ? setEditName(e.target.value) : setNewName(e.target.value)
          }
          placeholder={isAllPill ? "All, Full gallery, Everything…" : "Ceremony, Reception, Portraits…"}
          maxLength={80}
          disabled={saving}
          className="min-w-0 flex-1"
          aria-label={isRename ? "Pill name" : "New set name"}
        />
        <button
          type="submit"
          disabled={saving || !(isRename ? editName : newName).trim()}
          className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
        >
          {isRename ? "Save" : "Create"}
        </button>
        <button
          type="button"
          disabled={saving}
          className="rounded-lg px-2 py-1.5 text-[12px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
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

  const ghostDrag =
    draggingId && activeDragRef.current ? activeDragRef.current : null;

  const ghost =
    ghostDrag && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed z-[200] rounded-lg shadow-lg ring-2 ring-brand/40"
            style={{
              left: ghostPos.x - ghostDrag.offsetX,
              top: ghostPos.y - ghostDrag.offsetY,
              width: ghostDrag.width,
              height: ghostDrag.height,
            }}
          >
            <span
              className={cn(
                pillClass(
                  ghostDrag.id === ALL_SETS_PILL_ID
                    ? filter === "all"
                    : filter === ghostDrag.id,
                ),
                "h-full w-full",
              )}
            >
              <GripVertical className="ml-1 h-3 w-3 shrink-0 opacity-70" aria-hidden />
              <span className="max-w-[8rem] truncate px-0.5">{ghostDrag.label}</span>
            </span>
          </div>,
          document.body,
        )
      : null;

  const manageTargetLabel =
    filter === "all" ? allLabel : (activeSet?.name ?? "set");

  return (
    <div
      className={cn(
        "flex min-h-[2.5rem] items-center gap-2 py-0.5",
        draggingId && "select-none",
        className,
      )}
      title={setsTitle}
    >
      <div className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          role="tablist"
          aria-label={setsTitle}
          className="inline-flex gap-0.5 rounded-lg bg-zinc-100/90 p-0.5 dark:bg-zinc-900/50"
        >
          {hasSets
            ? orderedIds.map((id) => {
                if (id === ALL_SETS_PILL_ID) {
                  return renderPill(id, allLabel, filter === "all", counts.all);
                }
                const set = setsById.get(id);
                if (!set) return null;
                return renderPill(id, set.name, filter === set.id, counts.bySet[set.id] ?? 0);
              })
            : null}

          <button
            type="button"
            disabled={busy || saving || Boolean(draggingId)}
            onClick={() => setCreating(true)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition sm:px-3",
              hasSets
                ? "text-zinc-500 hover:bg-white hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                : "bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200/80 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700",
            )}
          >
            <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {hasSets ? "Add set" : "Create set"}
          </button>
        </div>
      </div>

      {canReorder ? (
        <span className="hidden shrink-0 text-[11px] text-zinc-500 dark:text-zinc-400 xl:inline">
          Drag to reorder
        </span>
      ) : null}

      {showUploadHint && filter === "all" && hasSets ? (
        <span className="hidden shrink-0 text-[11px] text-amber-800/90 dark:text-amber-200/90 lg:inline">
          Pick a set to upload
        </span>
      ) : null}

      {manageMenuItems && manageMenuItems.length > 0 ? (
        <Dropdown menu={{ items: manageMenuItems }} trigger={["click"]} disabled={busy}>
          <button
            type="button"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label={`Manage ${manageTargetLabel}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </Dropdown>
      ) : null}

      {ghost}
    </div>
  );
}
