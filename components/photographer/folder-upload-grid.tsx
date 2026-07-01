"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Dropdown, type MenuProps } from "antd";
import { Flag, ImageIcon, Lock, MoreVertical, Trash2, Unlock, Upload, X } from "lucide-react";
import { InlineActionSkeleton } from "@/components/ui/skeletons";
import { moveIdInList } from "@/lib/move-id-in-list";
import { cn } from "@/lib/utils";

const DRAG_START_PX = 6;

export type FolderUploadGridItem = {
  id: string;
  name: string;
  mediaSrc: string;
  isVideo: boolean;
  locked?: boolean;
  outstandingBalanceGhs?: number | null;
  flagged?: boolean;
  /** Show subtle processing overlay while thumbnails are generating. */
  derivativesPending?: boolean;
};

function MediaThumb({
  src,
  name,
  isVideo,
  derivativesPending,
}: {
  src: string;
  name: string;
  isVideo: boolean;
  derivativesPending?: boolean;
}) {
  return (
    <>
      {isVideo ? (
        <video
          src={src}
          muted
          playsInline
          preload="metadata"
          aria-label={name}
          className="pointer-events-none h-full w-full bg-black object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="pointer-events-none h-full w-full object-cover" loading="lazy" />
      )}
      {derivativesPending && !isVideo ? (
        <span
          className="pointer-events-none absolute inset-0 z-[4] flex items-center justify-center bg-black/20 backdrop-blur-[1px]"
          aria-hidden
        >
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white/90" />
        </span>
      ) : null}
      {isVideo ? (
        <span className="pointer-events-none absolute left-2 bottom-2 z-[5] rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
          Video
        </span>
      ) : null}
    </>
  );
}

type UploadTileProps = {
  item: FolderUploadGridItem;
  selected: boolean;
  deleting: boolean;
  isPlaceholder: boolean;
  isDropTarget: boolean;
  canReorder: boolean;
  isDragging: boolean;
  mediaDeleteBlocked: boolean;
  deleteKeyPrefix: "raw" | "final";
  onToggleSelected: (id: string) => void;
  onOpenPreview: (id: string) => void;
  onDelete: (id: string) => void;
  onSetCover?: (id: string) => void;
  onLockFinal?: (id: string) => void;
  onUnlockFinal?: (id: string) => void;
  lockBusyId?: string | null;
  settingCover: boolean;
  onTilePointerDown: (event: React.PointerEvent<HTMLElement>, item: FolderUploadGridItem) => void;
};

function UploadTile({
  item,
  selected,
  deleting,
  isPlaceholder,
  isDropTarget,
  canReorder,
  isDragging,
  mediaDeleteBlocked,
  deleteKeyPrefix,
  onToggleSelected,
  onOpenPreview,
  onDelete,
  onSetCover,
  onLockFinal,
  onUnlockFinal,
  lockBusyId,
  settingCover,
  onTilePointerDown,
}: UploadTileProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const actionBusy = deleting || settingCover || lockBusyId === item.id;

  const menuItems = useMemo<NonNullable<MenuProps["items"]>>(() => {
    const items: NonNullable<MenuProps["items"]> = [];
    if (onSetCover && !item.isVideo) {
      items.push({
        key: "cover",
        label: settingCover ? "Setting cover…" : "Set as cover image",
        icon: <ImageIcon className="h-3.5 w-3.5" aria-hidden />,
        disabled: mediaDeleteBlocked || actionBusy,
      });
    }
    if (deleteKeyPrefix === "final") {
      if (item.locked && onUnlockFinal) {
        items.push({
          key: "unlock",
          label: "Unlock for client download",
          icon: <Unlock className="h-3.5 w-3.5" aria-hidden />,
          disabled: mediaDeleteBlocked || actionBusy,
        });
      } else if (!item.locked && onLockFinal) {
        items.push({
          key: "lock",
          label: "Lock for client",
          icon: <Lock className="h-3.5 w-3.5" aria-hidden />,
          disabled: mediaDeleteBlocked || actionBusy,
        });
      }
    }
    items.push({
      key: "delete",
      label: "Delete",
      icon: <Trash2 className="h-3.5 w-3.5" aria-hidden />,
      danger: true,
      disabled: mediaDeleteBlocked || actionBusy,
    });
    return items;
  }, [actionBusy, deleteKeyPrefix, item.isVideo, item.locked, mediaDeleteBlocked, onLockFinal, onSetCover, onUnlockFinal, settingCover]);

  const onMenuClick: MenuProps["onClick"] = ({ key, domEvent }) => {
    domEvent.stopPropagation();
    setMenuOpen(false);
    if (key === "cover") {
      onSetCover?.(item.id);
      return;
    }
    if (key === "lock") {
      onLockFinal?.(item.id);
      return;
    }
    if (key === "unlock") {
      onUnlockFinal?.(item.id);
      return;
    }
    if (key === "delete") {
      onDelete(item.id);
    }
  };
  if (isPlaceholder) {
    return (
      <div
        className={cn(
          "aspect-square w-full rounded-xl border-2 border-dashed transition-colors duration-200",
          isDropTarget
            ? "border-brand bg-brand/10 dark:bg-brand/15"
            : "border-zinc-300/80 bg-zinc-100/50 dark:border-zinc-600 dark:bg-zinc-800/40",
        )}
        aria-hidden
      />
    );
  }

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-900/5 transition-[transform,opacity,box-shadow] duration-200 ease-out dark:bg-zinc-800/80 dark:ring-white/10",
        selected && "ring-2 ring-inset ring-brand",
        isDragging && "opacity-0",
        !isDragging && canReorder && "hover:shadow-md",
      )}
      onPointerDown={(event) => onTilePointerDown(event, item)}
    >
      <div className="relative aspect-square w-full overflow-hidden">
        <button
          type="button"
          className={cn(
            "absolute inset-0 z-0 flex h-full w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50",
            canReorder && "cursor-grab active:cursor-grabbing",
          )}
          onClick={() => onOpenPreview(item.id)}
          aria-label={`Preview ${item.name}`}
        >
          <MediaThumb
            src={item.mediaSrc}
            name={item.name}
            isVideo={item.isVideo}
            derivativesPending={item.derivativesPending}
          />
        </button>

        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25 transition-opacity",
            tileChromeVisibility(selected, menuOpen),
          )}
          aria-hidden
        />

        <label
          className={cn(
            "absolute left-1.5 top-1.5 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-black/40 text-white backdrop-blur-sm transition",
            tileChromeVisibility(selected, menuOpen),
            selected && "bg-brand",
          )}
        >
          <input
            type="checkbox"
            className="h-3 w-3 shrink-0 rounded-[2px] border-0 bg-white/90 text-brand outline-none accent-brand focus:ring-0 focus:ring-offset-0"
            checked={selected}
            onChange={() => onToggleSelected(item.id)}
            disabled={mediaDeleteBlocked}
            aria-label={`Select ${item.name}`}
          />
        </label>

        <div
          data-tile-more-menu
          className={cn(
            "absolute right-1.5 top-1.5 z-20",
            tileChromeVisibility(selected, menuOpen),
          )}
        >
          <Dropdown
            menu={{ items: menuItems, onClick: onMenuClick }}
            trigger={["click"]}
            open={menuOpen}
            onOpenChange={setMenuOpen}
            disabled={mediaDeleteBlocked && menuItems.length === 1 && menuItems[0]?.key === "delete"}
            placement="bottomRight"
            getPopupContainer={() => document.body}
          >
            <button
              type="button"
              disabled={mediaDeleteBlocked && !onSetCover}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/55"
              aria-label={`More actions for ${item.name}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              {actionBusy ? (
                <InlineActionSkeleton />
              ) : (
                <MoreVertical className="h-3.5 w-3.5" aria-hidden />
              )}
            </button>
          </Dropdown>
        </div>

        {item.flagged ? (
          <span
            className={cn(
              "pointer-events-none absolute bottom-2 z-10 inline-flex items-center gap-0.5 rounded-md bg-rose-600/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white",
              "left-2",
            )}
          >
            <Flag className="h-2.5 w-2.5" aria-hidden />
            Flagged
          </span>
        ) : null}
        {item.locked ? (
          <span className="pointer-events-none absolute bottom-2 right-2 z-10 inline-flex max-w-[calc(100%-1rem)] flex-col items-end gap-0.5">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
              <Lock className="h-2.5 w-2.5 shrink-0" aria-hidden />
              Locked
            </span>
            {item.outstandingBalanceGhs != null && item.outstandingBalanceGhs > 0 ? (
              <span className="rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-white">
                GHS {item.outstandingBalanceGhs.toFixed(2)} owing
              </span>
            ) : null}
          </span>
        ) : null}
        <p
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 truncate px-2.5 pb-2 pt-6 text-[10px] font-medium text-white transition-opacity",
            tileChromeVisibility(selected, menuOpen),
          )}
          title={item.name}
        >
          {item.name}
        </p>
      </div>
    </article>
  );
}

export function FolderUploadSectionHeader({
  icon: Icon,
  title,
  description,
  count,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  count?: number;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand dark:bg-brand/15 dark:text-brand-on-dark">
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h3>
          {count != null && count > 0 ? (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {count} {count === 1 ? "file" : "files"}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  );
}

export function FolderUploadBulkToolbar({
  selectedCount,
  totalCount,
  allSelected,
  onSelectAll,
  onDeleteSelected,
  onDeleteAll,
  deletingKey,
  mediaDeleteBlocked,
  deleteKeyPrefix,
  selectAllRef,
}: {
  selectedCount: number;
  totalCount?: number;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onDeleteSelected: () => void;
  onDeleteAll: () => void;
  deletingKey: string | null;
  mediaDeleteBlocked: boolean;
  deleteKeyPrefix: "raw" | "final";
  selectAllRef?: RefObject<HTMLInputElement | null>;
}) {
  const hasSelection = selectedCount > 0;
  const deletingSelected = deletingKey === `${deleteKeyPrefix}:bulk`;
  const deletingAll = deletingKey === `${deleteKeyPrefix}:all`;
  const actionBusy = deletingSelected || deletingAll;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 py-1 transition-[background-color] duration-300 ease-out motion-reduce:transition-none",
        hasSelection && "rounded-xl bg-brand-soft/40 px-2 dark:bg-brand/10",
      )}
    >
      <label
        className={cn(
          "inline-flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-2 py-1.5 text-xs font-medium transition",
          hasSelection
            ? "text-brand-ink dark:text-brand-on-dark"
            : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60",
        )}
      >
        <input
          ref={selectAllRef}
          type="checkbox"
          checked={allSelected}
          disabled={mediaDeleteBlocked}
          onChange={(e) => onSelectAll(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-brand focus:ring-2 focus:ring-brand/30 focus:ring-offset-0 disabled:opacity-40 dark:border-zinc-600"
        />
        <span>{allSelected ? "All selected" : "Select all"}</span>
      </label>

      {hasSelection ? (
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-2 text-[11px] font-bold tabular-nums text-white shadow-sm">
            {selectedCount}
          </span>
          {totalCount != null ? (
            <span className="text-[11px] font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
              of {totalCount}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">selected</span>
          )}
        </div>
      ) : null}

      <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
        {hasSelection ? (
          <>
            <button
              type="button"
              onClick={onDeleteSelected}
              disabled={mediaDeleteBlocked || actionBusy}
              className={cn(
                "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
                "border-red-200/90 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100",
                "disabled:cursor-not-allowed disabled:opacity-45",
                "dark:border-red-400/35 dark:bg-red-500/15 dark:text-red-100 dark:hover:bg-red-500/25",
              )}
            >
              {deletingSelected ? (
                <InlineActionSkeleton />
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                  <span>Delete</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onSelectAll(false)}
              disabled={mediaDeleteBlocked || actionBusy}
              title="Clear selection"
              aria-label="Clear selection"
              className={cn(
                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200/90 bg-white text-zinc-500 transition",
                "hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800",
                "disabled:cursor-not-allowed disabled:opacity-45",
                "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200",
              )}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
            <span className="hidden h-4 w-px bg-zinc-200 sm:block dark:bg-zinc-700" aria-hidden />
          </>
        ) : null}
        <button
          type="button"
          onClick={onDeleteAll}
          disabled={mediaDeleteBlocked || actionBusy}
          className={cn(
            "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition",
            hasSelection
              ? "text-zinc-500 hover:bg-white/70 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-200"
              : cn(
                  "border border-red-200/90 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100",
                  "dark:border-red-400/35 dark:bg-red-500/15 dark:text-red-100 dark:hover:bg-red-500/25",
                ),
            "disabled:cursor-not-allowed disabled:opacity-45",
          )}
        >
          {deletingAll ? (
            <InlineActionSkeleton />
          ) : (
            <>
              <Trash2
                className={cn("h-3.5 w-3.5 shrink-0", hasSelection ? "opacity-70" : "opacity-90")}
                aria-hidden
              />
              <span>Delete all</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function FolderUploadOptionToggle({
  checked,
  onChange,
  disabled,
  label,
  hint,
  prerequisiteMet = true,
  prerequisiteMessage,
  onPrerequisiteNeeded,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
  hint?: string;
  /** When false, turning the toggle on is blocked until studio settings are enabled. */
  prerequisiteMet?: boolean;
  prerequisiteMessage?: string;
  onPrerequisiteNeeded?: () => void;
}) {
  const displayChecked = prerequisiteMet ? checked : false;

  function handleToggle() {
    if (disabled) return;
    if (!checked && !prerequisiteMet) {
      onPrerequisiteNeeded?.();
      return;
    }
    onChange(!checked);
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-100 bg-zinc-50/80 px-3.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50",
        disabled && "opacity-60",
        !prerequisiteMet && !checked && "border-amber-200/80 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">{label}</p>
          {hint ? (
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">{hint}</p>
          ) : null}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={displayChecked}
          aria-label={label}
          disabled={disabled}
          onClick={handleToggle}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed",
            displayChecked ? "bg-brand" : "bg-zinc-300 dark:bg-zinc-600",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
              displayChecked && "translate-x-5",
            )}
          />
        </button>
      </div>
      {!prerequisiteMet && prerequisiteMessage ? (
        <p className="mt-2 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200/90">
          {prerequisiteMessage}{" "}
          <button
            type="button"
            onClick={onPrerequisiteNeeded}
            className="font-semibold text-brand underline underline-offset-2 hover:text-brand-hover dark:text-brand-on-dark"
          >
            Enable in settings
          </button>
        </p>
      ) : null}
    </div>
  );
}

/** Always visible on touch-sized viewports; on `sm+` show on hover unless selected. */
function tileChromeVisibility(selected: boolean, menuOpen = false) {
  if (selected || menuOpen) return "opacity-100";
  return "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100";
}

type ActiveDrag = {
  id: string;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  item: FolderUploadGridItem;
};

export function FolderUploadMediaGrid({
  items,
  selectedIds,
  onToggleSelected,
  onOpenPreview,
  onDelete,
  onSetCover,
  onLockFinal,
  onUnlockFinal,
  lockBusyId,
  deletingKey,
  settingCoverKey,
  mediaDeleteBlocked,
  deleteKeyPrefix,
  reorderable = false,
  reorderDisabled = false,
  onReorder,
}: {
  items: FolderUploadGridItem[];
  selectedIds: Set<string>;
  onToggleSelected: (id: string) => void;
  onOpenPreview: (id: string) => void;
  onDelete: (id: string) => void;
  onSetCover?: (id: string) => void;
  onLockFinal?: (id: string) => void;
  onUnlockFinal?: (id: string) => void;
  lockBusyId?: string | null;
  deletingKey: string | null;
  settingCoverKey: string | null;
  mediaDeleteBlocked: boolean;
  deleteKeyPrefix: "raw" | "final";
  reorderable?: boolean;
  reorderDisabled?: boolean;
  onReorder?: (orderedIds: string[]) => void;
}) {
  const tileRefs = useRef(new Map<string, HTMLLIElement>());
  const pendingDragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    item: FolderUploadGridItem;
  } | null>(null);
  const activeDragRef = useRef<Omit<ActiveDrag, "pointerX" | "pointerY"> | null>(null);
  const suppressPreviewRef = useRef(false);
  const orderedIdsRef = useRef<string[]>([]);

  const [orderedIds, setOrderedIds] = useState<string[]>(() => items.map((item) => item.id));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [hoverId, setHoverId] = useState<string | null>(null);

  orderedIdsRef.current = orderedIds;

  useEffect(() => {
    setOrderedIds((prev) => {
      const incoming = items.map((item) => item.id);
      const incomingSet = new Set(incoming);
      const kept = prev.filter((id) => incomingSet.has(id));
      const added = incoming.filter((id) => !prev.includes(id));
      return [...kept, ...added];
    });
  }, [items]);

  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const displayItems = useMemo(
    () =>
      orderedIds
        .map((id) => itemsById.get(id))
        .filter((item): item is FolderUploadGridItem => Boolean(item)),
    [itemsById, orderedIds],
  );

  const canReorder = reorderable && !reorderDisabled && Boolean(onReorder) && items.length > 1;

  const findHoverIndex = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const tile = el?.closest("[data-upload-tile-id]") as HTMLElement | null;
    const hoverTileId = tile?.dataset.uploadTileId;
    if (!hoverTileId) return -1;
    return orderedIdsRef.current.indexOf(hoverTileId);
  }, []);

  const beginDrag = useCallback(
    (
      item: FolderUploadGridItem,
      pointerX: number,
      pointerY: number,
      offsetX: number,
      offsetY: number,
      width: number,
      height: number,
    ) => {
      activeDragRef.current = {
        id: item.id,
        offsetX,
        offsetY,
        width,
        height,
        item,
      };
      setGhostPos({ x: pointerX, y: pointerY });
      setDraggingId(item.id);
      setHoverId(item.id);
    },
    [],
  );

  const endDrag = useCallback(() => {
    const drag = activeDragRef.current;
    pendingDragRef.current = null;
    activeDragRef.current = null;
    setDraggingId(null);
    setHoverId(null);

    if (!drag || !onReorder) return;

    const finalIds = orderedIdsRef.current;
    const initialIds = items.map((item) => item.id);
    const changed =
      finalIds.length !== initialIds.length ||
      finalIds.some((id, index) => id !== initialIds[index]);

    if (changed) {
      suppressPreviewRef.current = true;
      onReorder(finalIds);
    }
  }, [items, onReorder]);

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
      const tile = el?.closest("[data-upload-tile-id]") as HTMLElement | null;
      setHoverId(tile?.dataset.uploadTileId ?? null);

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
        pending.item,
        event.clientX,
        event.clientY,
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
    (event: React.PointerEvent<HTMLElement>, item: FolderUploadGridItem) => {
      if (!canReorder) return;
      const tile = tileRefs.current.get(item.id);
      if (!tile) return;

      const rect = tile.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;

      pendingDragRef.current = {
        id: item.id,
        startX: event.clientX,
        startY: event.clientY,
        offsetX,
        offsetY,
        width: rect.width,
        height: rect.height,
        item,
      };
    },
    [canReorder],
  );

  const onPreviewClick = useCallback(
    (id: string) => {
      if (suppressPreviewRef.current) {
        suppressPreviewRef.current = false;
        return;
      }
      onOpenPreview(id);
    },
    [onOpenPreview],
  );

  const ghost =
    draggingId && activeDragRef.current && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed z-[200] overflow-hidden rounded-xl bg-zinc-100 shadow-2xl ring-2 ring-brand/50 dark:bg-zinc-800"
            style={{
              left: ghostPos.x - activeDragRef.current.offsetX,
              top: ghostPos.y - activeDragRef.current.offsetY,
              width: activeDragRef.current.width,
              height: activeDragRef.current.height,
              transform: "rotate(-2deg) scale(1.04)",
            }}
          >
            <div className="relative h-full w-full">
              <MediaThumb
                src={activeDragRef.current.item.mediaSrc}
                name={activeDragRef.current.item.name}
                isVideo={activeDragRef.current.item.isVideo}
              />
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="space-y-2">
      {canReorder ? (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Hold and drag a photo to reposition — other tiles shift as you move.
        </p>
      ) : null}
      <ul
        className={cn(
          "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
          draggingId && "select-none",
        )}
      >
        {displayItems.map((item) => {
          const selected = selectedIds.has(item.id);
          const deleting = deletingKey === `${deleteKeyPrefix}:${item.id}`;
          const settingCover = settingCoverKey === `${deleteKeyPrefix}:${item.id}`;
          const isDragging = draggingId === item.id;
          const isDropTarget = Boolean(
            hoverId && hoverId === item.id && draggingId && draggingId !== item.id,
          );

          return (
            <li
              key={item.id}
              ref={(node) => {
                if (node) tileRefs.current.set(item.id, node);
                else tileRefs.current.delete(item.id);
              }}
              data-upload-tile-id={item.id}
              className="transition-transform duration-200 ease-out"
            >
              <UploadTile
                item={item}
                selected={selected}
                deleting={deleting}
                isPlaceholder={isDragging}
                isDropTarget={isDropTarget}
                canReorder={canReorder}
                isDragging={isDragging}
                mediaDeleteBlocked={mediaDeleteBlocked}
                deleteKeyPrefix={deleteKeyPrefix}
                onToggleSelected={onToggleSelected}
                onOpenPreview={onPreviewClick}
                onDelete={onDelete}
                onSetCover={onSetCover}
                onLockFinal={onLockFinal}
                onUnlockFinal={onUnlockFinal}
                lockBusyId={lockBusyId}
                settingCover={settingCover}
                onTilePointerDown={(event, tile) => {
                  const target = event.target as HTMLElement;
                  if (target.closest("label,input,[data-tile-more-menu]")) return;
                  armDrag(event, tile);
                }}
              />
            </li>
          );
        })}
      </ul>
      {ghost}
    </div>
  );
}

export function FolderUploadEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200/90 bg-zinc-50/40 px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/25">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
        <Upload className="h-5 w-5" strokeWidth={1.5} aria-hidden />
      </span>
      <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
    </div>
  );
}
