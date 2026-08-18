"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { moveIdInList } from "@/lib/move-id-in-list";
import {
  releasePointer,
  usePointerReorderArm,
} from "@/lib/pointer-reorder";
import { cn } from "@/lib/utils";

export type ReorderableGalleryGridRenderState = {
  isDragging: boolean;
  isDropTarget: boolean;
  isPressing: boolean;
  blockNavigation: boolean;
  onReorderPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
};

type ReorderableGalleryGridProps<T> = {
  items: T[];
  getItemId: (item: T) => string;
  reorderable?: boolean;
  onReorder?: (orderedIds: string[]) => void;
  className?: string;
  hint?: string;
  renderItem: (item: T, state: ReorderableGalleryGridRenderState) => ReactNode;
  renderGhost?: (item: T) => ReactNode;
};

export function ReorderableGalleryGrid<T>({
  items,
  getItemId,
  reorderable = false,
  onReorder,
  className,
  hint,
  renderItem,
  renderGhost,
}: ReorderableGalleryGridProps<T>) {
  const tileRefs = useRef(new Map<string, HTMLLIElement>());
  const activeDragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    item: T;
    pointerId: number;
    captureEl: HTMLElement | null;
  } | null>(null);
  const orderedIdsRef = useRef<string[]>([]);

  const [orderedIds, setOrderedIds] = useState<string[]>(() => items.map(getItemId));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [blockNavigation, setBlockNavigation] = useState(false);

  orderedIdsRef.current = orderedIds;

  useEffect(() => {
    setOrderedIds((prev) => {
      const incoming = items.map(getItemId);
      const incomingSet = new Set(incoming);
      const kept = prev.filter((id) => incomingSet.has(id));
      const added = incoming.filter((id) => !prev.includes(id));
      return [...kept, ...added];
    });
  }, [items, getItemId]);

  const itemsById = useMemo(() => {
    const map = new Map<string, T>();
    for (const item of items) map.set(getItemId(item), item);
    return map;
  }, [getItemId, items]);

  const displayItems = useMemo(
    () =>
      orderedIds
        .map((id) => itemsById.get(id))
        .filter((item): item is T => Boolean(item)),
    [itemsById, orderedIds],
  );

  const canReorder = reorderable && Boolean(onReorder) && items.length > 1;

  const findHoverIndex = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const tile = el?.closest("[data-gallery-tile-id]") as HTMLElement | null;
    const hoverTileId = tile?.dataset.galleryTileId;
    if (!hoverTileId) return -1;
    return orderedIdsRef.current.indexOf(hoverTileId);
  }, []);

  const beginDrag = useCallback(
    (
      item: T,
      pointerX: number,
      pointerY: number,
      offsetX: number,
      offsetY: number,
      width: number,
      height: number,
      pointerId: number,
      captureEl: HTMLElement | null,
    ) => {
      const id = getItemId(item);
      activeDragRef.current = { id, offsetX, offsetY, width, height, item, pointerId, captureEl };
      setGhostPos({ x: pointerX, y: pointerY });
      setDraggingId(id);
      setHoverId(id);
      setBlockNavigation(true);
    },
    [getItemId],
  );

  const { arm, clearPending, pressingId } = usePointerReorderArm<T>({
    enabled: canReorder,
    isDragging: Boolean(draggingId),
    onBegin: (armed, pointerX, pointerY) => {
      beginDrag(
        armed.payload,
        pointerX,
        pointerY,
        armed.offsetX,
        armed.offsetY,
        armed.width,
        armed.height,
        armed.pointerId,
        armed.captureEl,
      );
    },
  });

  const endDrag = useCallback(() => {
    const drag = activeDragRef.current;
    if (drag) releasePointer(drag.captureEl, drag.pointerId);
    clearPending();
    activeDragRef.current = null;
    setDraggingId(null);
    setHoverId(null);

    if (!drag || !onReorder) {
      window.setTimeout(() => setBlockNavigation(false), 0);
      return;
    }

    const finalIds = orderedIdsRef.current;
    const initialIds = items.map(getItemId);
    const changed =
      finalIds.length !== initialIds.length ||
      finalIds.some((id, index) => id !== initialIds[index]);

    if (changed) {
      window.setTimeout(() => setBlockNavigation(false), 0);
      onReorder(finalIds);
      return;
    }
    window.setTimeout(() => setBlockNavigation(false), 0);
  }, [clearPending, getItemId, items, onReorder]);

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
      const tile = el?.closest("[data-gallery-tile-id]") as HTMLElement | null;
      setHoverId(tile?.dataset.galleryTileId ?? null);

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

  const armDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>, item: T) => {
      const id = getItemId(item);
      arm(event, tileRefs.current.get(id) ?? null, item, { pressKey: id });
    },
    [arm, getItemId],
  );

  const ghostItem =
    draggingId && activeDragRef.current ? activeDragRef.current.item : null;

  const ghost =
    ghostItem && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed z-[200] overflow-hidden rounded-lg shadow-2xl ring-2 ring-brand/50"
            style={{
              left: ghostPos.x - activeDragRef.current!.offsetX,
              top: ghostPos.y - activeDragRef.current!.offsetY,
              width: activeDragRef.current!.width,
              height: activeDragRef.current!.height,
              transform: "rotate(-1.5deg) scale(1.03)",
            }}
          >
            {renderGhost ? renderGhost(ghostItem) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="space-y-2">
      {canReorder && hint ? (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
      <ul
        className={cn("m-0 list-none p-0", className, draggingId && "select-none touch-none")}
        aria-live={draggingId ? "polite" : undefined}
      >
        {displayItems.map((item) => {
          const id = getItemId(item);
          const isDragging = draggingId === id;
          const isDropTarget = Boolean(
            hoverId && hoverId === id && draggingId && draggingId !== id,
          );

          return (
            <li
              key={id}
              ref={(node) => {
                if (node) tileRefs.current.set(id, node);
                else tileRefs.current.delete(id);
              }}
              data-gallery-tile-id={id}
              className={cn(
                "transition-transform duration-200 ease-out",
                isDropTarget && "scale-[0.98]",
              )}
            >
              {renderItem(item, {
                isDragging,
                isDropTarget,
                isPressing: pressingId === id,
                blockNavigation,
                onReorderPointerDown: (event) => armDrag(event, item),
              })}
            </li>
          );
        })}
      </ul>
      {ghost}
    </div>
  );
}
