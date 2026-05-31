import { apiFolderStatusToUi, type ApiFolder } from "@/lib/folders-api";

export type GalleryStatusFilter = "all" | "DRAFT" | "SELECTION_PENDING" | "COMPLETED";

export type GalleryListStats = {
  total: number;
  inProgress: number;
  completed: number;
  draft: number;
};

export function computeGalleryListStats(folders: ApiFolder[]): GalleryListStats {
  let inProgress = 0;
  let completed = 0;
  let draft = 0;
  for (const f of folders) {
    const s = apiFolderStatusToUi(f.status);
    if (s === "COMPLETED") completed += 1;
    else if (s === "SELECTION_PENDING") inProgress += 1;
    else draft += 1;
  }
  return { total: folders.length, inProgress, completed, draft };
}

export function filterGalleriesByStatus(
  folders: ApiFolder[],
  filter: GalleryStatusFilter,
): ApiFolder[] {
  if (filter === "all") return folders;
  return folders.filter((f) => apiFolderStatusToUi(f.status) === filter);
}
