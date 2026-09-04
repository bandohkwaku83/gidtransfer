"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import {
  Archive,
  ArrowLeft,
  ChevronRight,
  FolderPlus,
  ImagePlus,
  MoreHorizontal,
  Settings2,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import {
  dashboardPageHeaderCtaClassName,
  dashboardPageHeaderCtaSecondaryClassName,
} from "@/components/dashboard/dashboard-page-header";
import {
  CollabAvatar,
  CollabBackLink,
  CollabBadge,
  CollabEmptyState,
  CollabLoadingState,
  CollabPageShell,
  CollabSectionLabel,
  CollabStatusDot,
  CollabSurface,
  formatCollabRelative,
} from "@/components/collaborations/collab-ui";
import { DashboardSpin } from "@/components/ui/skeletons";
import { useToast } from "@/components/toast-provider";
import { sameOriginUploadsUrl } from "@/lib/api";
import {
  collaborationRoleAtLeast,
  collaborationRoleLabel,
  createCollaborationFolder,
  deleteCollaboration,
  deleteCollaborationMedia,
  getCollaboration,
  leaveCollaboration,
  listCollaborationFolders,
  listCollaborationMedia,
  listCollaborationMembers,
  updateCollaboration,
  type CollaborationAsset,
  type CollaborationFolder,
  type CollaborationMember,
  type CollaborationWorkspace,
} from "@/lib/collaborations-api";
import { s3UploadCollaborationPhotos } from "@/lib/collaborations-upload-s3";
import { isGalleryUploadPartialError } from "@/lib/gallery-upload-s3";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";
import { cn } from "@/lib/utils";

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

export default function CollaborationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const { handlePlanError } = usePlanEntitlements();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [workspace, setWorkspace] = useState<CollaborationWorkspace | null>(null);
  const [folders, setFolders] = useState<CollaborationFolder[]>([]);
  const [assets, setAssets] = useState<CollaborationAsset[]>([]);
  const [members, setMembers] = useState<CollaborationMember[]>([]);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  const canEdit = collaborationRoleAtLeast(workspace?.role, "editor");
  const isOwner = collaborationRoleAtLeast(workspace?.role, "owner");

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ workspace: ws }, { folders: nextFolders }, membersRes] = await Promise.all([
        getCollaboration(id),
        listCollaborationFolders(id),
        listCollaborationMembers(id).catch(() => null),
      ]);
      setWorkspace(ws);
      setFolders(nextFolders);
      setEditName(ws.name);
      setEditDescription(ws.description ?? "");
      if (membersRes) {
        setMembers(membersRes.members);
        setOwnerName(membersRes.owner?.name || membersRes.owner?.email || ws.owner?.name || null);
      } else {
        setOwnerName(ws.owner?.name || ws.owner?.email || null);
      }
    } catch (err) {
      if (handlePlanError(err)) {
        setError(
          "This workspace requires a Premium plan to create — you may still join as an invitee.",
        );
      } else {
        setError(err instanceof Error ? err.message : "Failed to load workspace.");
      }
    } finally {
      setLoading(false);
    }
  }, [handlePlanError, id]);

  const loadMedia = useCallback(async () => {
    setMediaLoading(true);
    try {
      const { assets: next } = await listCollaborationMedia(id, {
        folderId: folderId ?? undefined,
        limit: 100,
      });
      setAssets(next);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load media.", "error");
    } finally {
      setMediaLoading(false);
    }
  }, [folderId, id, showToast]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!workspace) return;
    void loadMedia();
  }, [loadMedia, workspace]);

  async function onCreateFolder(e: FormEvent) {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    setCreatingFolder(true);
    try {
      const { folder } = await createCollaborationFolder(id, { name });
      setFolders((prev) => [...prev, folder].sort((a, b) => a.sortOrder - b.sortOrder));
      setNewFolderName("");
      setShowFolderForm(false);
      setFolderId(folder.id);
      showToast("Folder created.", "success");
    } catch (err) {
      if (handlePlanError(err)) return;
      showToast(err instanceof Error ? err.message : "Could not create folder.", "error");
    } finally {
      setCreatingFolder(false);
    }
  }

  async function onUploadFiles(files: FileList | File[] | null) {
    if (!files || !canEdit) return;
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setUploadLabel(`0/${list.length}`);
    try {
      const result = await s3UploadCollaborationPhotos(id, list, {
        folderId,
        onProgress: (p) => {
          setUploadLabel(`${p.filesUploaded}/${p.filesTotal}`);
        },
      });
      showToast(
        result.assets.length === 1
          ? "1 photo uploaded."
          : `${result.assets.length} photos uploaded.`,
        "success",
      );
      await loadMedia();
    } catch (err) {
      if (handlePlanError(err)) return;
      if (isGalleryUploadPartialError(err)) {
        showToast(err.message, "error");
        await loadMedia();
      } else {
        showToast(err instanceof Error ? err.message : "Upload failed.", "error");
      }
    } finally {
      setUploading(false);
      setUploadLabel("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onDeleteAsset(asset: CollaborationAsset) {
    if (!canEdit) return;
    if (!window.confirm(`Delete "${asset.originalFilename}"?`)) return;
    try {
      await deleteCollaborationMedia(id, asset.id);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      showToast("Asset deleted.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete.", "error");
    }
  }

  async function onSaveMeta(e: FormEvent) {
    e.preventDefault();
    if (!isOwner) return;
    setSavingMeta(true);
    try {
      const { workspace: next } = await updateCollaboration(id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
      });
      setWorkspace(next);
      setEditing(false);
      showToast("Workspace updated.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update.", "error");
    } finally {
      setSavingMeta(false);
    }
  }

  async function onArchiveToggle() {
    if (!isOwner || !workspace) return;
    setMenuOpen(false);
    const nextStatus = workspace.status === "archived" ? "active" : "archived";
    try {
      const { workspace: next } = await updateCollaboration(id, { status: nextStatus });
      setWorkspace(next);
      showToast(
        nextStatus === "archived" ? "Workspace archived." : "Workspace restored.",
        "success",
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update status.", "error");
    }
  }

  async function onDeleteWorkspace() {
    if (!isOwner) return;
    setMenuOpen(false);
    if (!window.confirm("Delete this workspace permanently? This cannot be undone.")) return;
    try {
      await deleteCollaboration(id);
      showToast("Workspace deleted.", "success");
      router.replace("/collaborations");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete.", "error");
    }
  }

  async function onLeave() {
    if (isOwner) return;
    setMenuOpen(false);
    if (!window.confirm("Leave this workspace?")) return;
    try {
      await leaveCollaboration(id);
      showToast("Left workspace.", "success");
      router.replace("/collaborations");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not leave.", "error");
    }
  }

  function onDragOver(e: DragEvent) {
    if (!canEdit) return;
    e.preventDefault();
    setDragging(true);
  }

  function onDragLeave(e: DragEvent) {
    if (!canEdit) return;
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragging(false);
  }

  function onDrop(e: DragEvent) {
    if (!canEdit) return;
    e.preventDefault();
    setDragging(false);
    void onUploadFiles(e.dataTransfer.files);
  }

  const teamNames = [
    ...(ownerName ? [ownerName] : []),
    ...members
      .filter((m) => m.status === "active" || m.status === "invited")
      .map((m) => m.user?.name || m.email)
      .filter(Boolean),
  ];
  const pendingMembers = members.filter((m) => m.status === "invited").length;
  const currentFolder = folders.find((f) => f.id === folderId);
  const totalBytes = assets.reduce((sum, a) => sum + (a.sizeBytes || 0), 0);

  if (loading) {
    return (
      <CollabPageShell>
        <CollabLoadingState label="Loading workspace…" />
      </CollabPageShell>
    );
  }

  if (error || !workspace) {
    return (
      <CollabPageShell>
        <div className="mx-auto max-w-lg py-16 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{error ?? "Not found."}</p>
          <Link
            href="/collaborations"
            className={dashboardPageHeaderCtaSecondaryClassName("mt-6 inline-flex")}
          >
            Back to collaborations
          </Link>
        </div>
      </CollabPageShell>
    );
  }

  return (
    <CollabPageShell>
      <div>
        <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-zinc-400">
          <CollabBackLink href="/collaborations">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Collaborations
          </CollabBackLink>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <span className="truncate font-medium text-zinc-700 dark:text-zinc-200">
            {workspace.name}
          </span>
        </nav>

        <CollabSurface className="overflow-hidden">
          <div className="border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                {editing && isOwner ? (
                  <form onSubmit={onSaveMeta} className="space-y-3">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-display text-xl font-semibold tracking-tight outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15 dark:border-zinc-700 dark:bg-zinc-950"
                      required
                    />
                    <input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15 dark:border-zinc-700 dark:bg-zinc-950"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={savingMeta}
                        className={dashboardPageHeaderCtaClassName()}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className={dashboardPageHeaderCtaSecondaryClassName()}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-display text-[1.5rem] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[1.65rem]">
                        {workspace.name}
                      </h1>
                      <CollabBadge tone={workspace.role === "owner" ? "brand" : "neutral"}>
                        {collaborationRoleLabel(workspace.role)}
                      </CollabBadge>
                      {workspace.status === "archived" ? (
                        <CollabBadge tone="warn">
                          <CollabStatusDot status="archived" />
                          Archived
                        </CollabBadge>
                      ) : (
                        <CollabBadge tone="success">
                          <CollabStatusDot status="active" />
                          Active
                        </CollabBadge>
                      )}
                    </div>
                    {workspace.description ? (
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                        {workspace.description}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                      {ownerName ? <span>Owned by {ownerName}</span> : null}
                      <span>Updated {formatCollabRelative(workspace.updatedAt)}</span>
                      <span>
                        {workspace.memberCount}{" "}
                        {workspace.memberCount === 1 ? "member" : "members"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/collaborations/${id}/members`}
                  className={dashboardPageHeaderCtaSecondaryClassName(
                    "inline-flex items-center gap-2",
                  )}
                >
                  <Users className="h-4 w-4" aria-hidden />
                  {isOwner ? "Manage team" : "Team"}
                </Link>
                {canEdit ? (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => void onUploadFiles(e.target.files)}
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className={dashboardPageHeaderCtaClassName(
                        "inline-flex items-center gap-2",
                      )}
                    >
                      {uploading ? (
                        <DashboardSpin size="small" />
                      ) : (
                        <Upload className="h-4 w-4" aria-hidden />
                      )}
                      {uploading ? `Uploading ${uploadLabel}` : "Upload"}
                    </button>
                  </>
                ) : null}

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((o) => !o)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-300 dark:hover:bg-zinc-900"
                    aria-label="Workspace actions"
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden />
                  </button>
                  {menuOpen ? (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-10 cursor-default"
                        aria-label="Close menu"
                        onClick={() => setMenuOpen(false)}
                      />
                      <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
                        {isOwner ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpen(false);
                                setEditing(true);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
                            >
                              <Settings2 className="h-4 w-4" aria-hidden />
                              Edit details
                            </button>
                            <button
                              type="button"
                              onClick={() => void onArchiveToggle()}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
                            >
                              <Archive className="h-4 w-4" aria-hidden />
                              {workspace.status === "archived"
                                ? "Restore workspace"
                                : "Archive workspace"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void onDeleteWorkspace()}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                              Delete workspace
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void onLeave()}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            Leave workspace
                          </button>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex items-center -space-x-2">
                {teamNames.slice(0, 5).map((name, i) => (
                  <CollabAvatar key={`${name}-${i}`} name={name} size="sm" />
                ))}
                {teamNames.length > 5 ? (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600 ring-2 ring-white dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-950">
                    +{teamNames.length - 5}
                  </span>
                ) : null}
              </div>
              <div className="min-w-0 text-sm">
                <p className="font-medium text-zinc-800 dark:text-zinc-100">
                  {workspace.memberCount}{" "}
                  {workspace.memberCount === 1 ? "collaborator" : "collaborators"}
                </p>
                <p className="text-xs text-zinc-400">
                  {pendingMembers > 0
                    ? `${pendingMembers} pending invite${pendingMembers === 1 ? "" : "s"}`
                    : "Everyone who can access this shoot"}
                </p>
              </div>
            </div>
            <Link
              href={`/collaborations/${id}/members`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline dark:text-brand-on-dark"
            >
              {isOwner ? "Invite people" : "View members"}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </CollabSurface>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <aside className="space-y-4 lg:sticky lg:top-4">
          <CollabSurface className="p-2.5">
            <CollabSectionLabel className="px-1.5">Folders</CollabSectionLabel>
            <button
              type="button"
              onClick={() => setFolderId(null)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-sm transition",
                folderId == null
                  ? "bg-brand/10 font-medium text-brand dark:bg-brand/20 dark:text-brand-on-dark"
                  : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900",
              )}
            >
              <span>All media</span>
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => setFolderId(folder.id)}
                className={cn(
                  "mt-0.5 flex w-full items-center rounded-xl px-2.5 py-2 text-left text-sm transition",
                  folderId === folder.id
                    ? "bg-brand/10 font-medium text-brand dark:bg-brand/20 dark:text-brand-on-dark"
                    : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900",
                )}
              >
                <span className="truncate">{folder.name}</span>
              </button>
            ))}
            {canEdit ? (
              showFolderForm ? (
                <form onSubmit={onCreateFolder} className="mt-2 space-y-2 px-1">
                  <input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15 dark:border-zinc-700 dark:bg-zinc-900"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={creatingFolder}
                      className="rounded-lg bg-brand px-2.5 py-1 text-xs font-medium text-white"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFolderForm(false)}
                      className="rounded-lg px-2.5 py-1 text-xs text-zinc-500"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowFolderForm(true)}
                  className="mt-1 inline-flex w-full items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm text-zinc-500 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <FolderPlus className="h-4 w-4" aria-hidden />
                  New folder
                </button>
              )
            ) : null}
          </CollabSurface>

          <CollabSurface className="p-4">
            <CollabSectionLabel>Library</CollabSectionLabel>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-zinc-500">Files</dt>
                <dd className="font-medium text-zinc-800 dark:text-zinc-100">
                  {mediaLoading ? "…" : assets.length}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-zinc-500">Size</dt>
                <dd className="font-medium text-zinc-800 dark:text-zinc-100">
                  {mediaLoading ? "…" : formatBytes(totalBytes)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-zinc-500">Folders</dt>
                <dd className="font-medium text-zinc-800 dark:text-zinc-100">
                  {folders.length}
                </dd>
              </div>
            </dl>
          </CollabSurface>
        </aside>

        <section
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className="min-w-0"
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {currentFolder?.name ?? "All media"}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                {mediaLoading
                  ? "Loading…"
                  : assets.length === 0
                    ? "No files in this view"
                    : `${assets.length} file${assets.length === 1 ? "" : "s"} · ${formatBytes(totalBytes)}`}
              </p>
            </div>
            {canEdit && !uploading ? (
              <p className="text-xs text-zinc-400">Drop files anywhere to upload</p>
            ) : null}
          </div>

          {dragging && canEdit ? (
            <div className="mb-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand/40 bg-brand-soft/60 px-6 py-10 text-sm font-medium text-brand dark:bg-brand/15 dark:text-brand-on-dark">
              <Upload className="h-4 w-4" aria-hidden />
              Drop to upload into {currentFolder?.name ?? "All media"}
            </div>
          ) : null}

          {mediaLoading ? (
            <CollabLoadingState label="Loading media…" />
          ) : assets.length === 0 ? (
            <CollabEmptyState
              icon={<ImagePlus className="h-5 w-5" aria-hidden />}
              title="No media in this folder"
              description={
                canEdit
                  ? "Upload photos or videos to share with your collaborators."
                  : "View-only access — ask an editor to upload."
              }
              action={
                canEdit ? (
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className={dashboardPageHeaderCtaClassName(
                      "inline-flex items-center gap-2",
                    )}
                  >
                    <Upload className="h-4 w-4" aria-hidden />
                    Upload files
                  </button>
                ) : null
              }
            />
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {assets.map((asset) => {
                const src = sameOriginUploadsUrl(
                  asset.thumbUrl || asset.previewUrl || asset.url,
                );
                const uploader = asset.uploadedBy?.name || asset.uploadedBy?.email;
                return (
                  <li
                    key={asset.id}
                    className="group relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="aspect-square">
                      {asset.isVideo ? (
                        <video
                          src={sameOriginUploadsUrl(asset.url)}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt={asset.originalFilename}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-2.5 pt-8 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="truncate text-[11px] font-medium text-white">
                        {asset.originalFilename}
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="truncate text-[10px] text-white/70">
                          {uploader
                            ? uploader
                            : formatCollabRelative(asset.createdAt)}
                        </p>
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => void onDeleteAsset(asset)}
                            className="rounded-md bg-black/40 p-1 text-white transition hover:bg-red-600"
                            aria-label={`Delete ${asset.originalFilename}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {asset.isVideo ? (
                      <span className="absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Video
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </CollabPageShell>
  );
}
