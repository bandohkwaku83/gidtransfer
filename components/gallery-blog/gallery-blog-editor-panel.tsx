"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Check,
  Eye,
  FileText,
  Plus,
  Sparkles,
  Trash2,
  Wand,
} from "lucide-react";
import { FormInput, FormTextArea } from "@/components/ui/form-input";
import { DashboardSpin } from "@/components/ui/skeletons";
import { FormSelect } from "@/components/ui/form-select";
import type { ApiFolderMedia } from "@/lib/folders/types";
import {
  GALLERY_BLOG_TEMPLATES,
  createGalleryBlogPost,
  deleteGalleryBlogPost,
  ensureDemoGalleryBlogSeed,
  listGalleryBlogPosts,
  saveGalleryBlogPost,
  type GalleryBlogBlock,
  type GalleryBlogPost,
  type GalleryBlogTemplate,
} from "@/lib/gallery-blog";
import { GalleryBlogViewer } from "@/components/gallery-blog/gallery-blog-viewer";
import { cn } from "@/lib/utils";
import { useGuardViewOnlyWrite } from "@/lib/use-view-only-write";

type Props = {
  folderId: string;
  uploads: ApiFolderMedia[];
  busy?: boolean;
};

function mediaId(m: ApiFolderMedia): string {
  return (m._id ?? m.id ?? "").trim();
}

function mediaThumb(m: ApiFolderMedia): string {
  return (m.displayUrl ?? m.previewUrl ?? m.thumbUrl ?? m.url ?? "").trim();
}

function mediaName(m: ApiFolderMedia): string {
  return (m.originalFilename ?? m.originalName ?? m.name ?? "Photo").trim();
}

export function GalleryBlogEditorPanel({ folderId, uploads, busy = false }: Props) {
  const guardViewOnlyWrite = useGuardViewOnlyWrite();
  const [posts, setPosts] = useState<GalleryBlogPost[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTemplate, setNewTemplate] = useState<GalleryBlogTemplate>("editorial");
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const uploadRows = useMemo(
    () =>
      uploads
        .map((m) => ({ id: mediaId(m), thumb: mediaThumb(m), name: mediaName(m), row: m }))
        .filter((u) => u.id && u.thumb),
    [uploads],
  );

  const assetsById = useMemo(
    () =>
      new Map(
        uploadRows.map((u) => [
          u.id,
          { id: u.id, thumbUrl: u.thumb, previewUrl: u.thumb, originalName: u.name },
        ]),
      ),
    [uploadRows],
  );

  const refresh = useCallback(() => {
    ensureDemoGalleryBlogSeed(
      folderId,
      uploadRows.slice(0, 6).map((u) => u.id),
    );
    setPosts(listGalleryBlogPosts(folderId));
  }, [folderId, uploadRows]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activePost = activeId ? posts.find((p) => p.id === activeId) : null;

  function toggleAsset(id: string) {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleCreate() {
    if (guardViewOnlyWrite()) return;
    if (selectedAssetIds.length === 0) return;
    setSaving(true);
    try {
      const post = createGalleryBlogPost({
        folderId,
        title: newTitle.trim() || "New gallery story",
        template: newTemplate,
        assetIds: selectedAssetIds,
      });
      setCreating(false);
      setNewTitle("");
      setSelectedAssetIds([]);
      refresh();
      setActiveId(post.id);
    } finally {
      setSaving(false);
    }
  }

  function updateActive(patch: Partial<GalleryBlogPost>) {
    if (!activePost) return;
    const next: GalleryBlogPost = {
      ...activePost,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    saveGalleryBlogPost(folderId, next);
    refresh();
  }

  function updateBlock(index: number, block: GalleryBlogBlock) {
    if (!activePost) return;
    const blocks = [...activePost.blocks];
    blocks[index] = block;
    updateActive({ blocks });
  }

  function removeBlock(index: number) {
    if (!activePost) return;
    updateActive({ blocks: activePost.blocks.filter((_, i) => i !== index) });
  }

  function publishToggle() {
    if (!activePost) return;
    const publishing = activePost.status !== "published";
    updateActive({
      status: publishing ? "published" : "draft",
      publishedAt: publishing ? new Date().toISOString() : activePost.publishedAt,
    });
  }

  function handleDelete(postId: string) {
    if (guardViewOnlyWrite()) return;
    if (!window.confirm("Delete this blog post? This cannot be undone.")) return;
    deleteGalleryBlogPost(folderId, postId);
    if (activeId === postId) setActiveId(null);
    refresh();
  }

  if (creating) {
    return (
      <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">New blog post</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Pick photos from this gallery — we&apos;ll lay them out automatically, Pic-Time style.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreating(false)}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Cancel
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Post title
          </label>
          <FormInput
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Sarah & James — Tuscany wedding"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Layout template
          </label>
          <FormSelect
            value={newTemplate}
            onChange={(value) => setNewTemplate(value)}
            options={GALLERY_BLOG_TEMPLATES.map((t) => ({ value: t.id, label: t.label }))}
          />
        </div>
        <p className="-mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {GALLERY_BLOG_TEMPLATES.find((t) => t.id === newTemplate)?.description}
        </p>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Select photos ({selectedAssetIds.length})
          </p>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {uploadRows.map((u) => {
              const selected = selectedAssetIds.includes(u.id);
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => toggleAsset(u.id)}
                    className={cn(
                      "relative aspect-square w-full overflow-hidden rounded-xl ring-2 transition",
                      selected
                        ? "ring-brand"
                        : "ring-transparent hover:ring-zinc-300 dark:hover:ring-zinc-600",
                    )}
                  >
                    <Image src={u.thumb} alt="" fill sizes="120px" className="object-cover" />
                    {selected ? (
                      <span className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white shadow">
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          type="button"
          disabled={saving || selectedAssetIds.length === 0 || busy}
          onClick={() => void handleCreate()}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-40"
        >
          {saving ? <DashboardSpin size="small" /> : <Wand className="h-4 w-4" aria-hidden />}
          Generate layout
        </button>
      </div>
    );
  }

  if (activePost) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveId(null);
              setPreviewMode(false);
            }}
            className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← All posts
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              <Eye className="h-4 w-4" aria-hidden />
              {previewMode ? "Edit" : "Preview"}
            </button>
            <button
              type="button"
              onClick={publishToggle}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white",
                activePost.status === "published" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-brand hover:bg-brand-hover",
              )}
            >
              {activePost.status === "published" ? "Published" : "Publish"}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(activePost.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete
            </button>
          </div>
        </div>

        {previewMode ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
            <GalleryBlogViewer post={activePost} assetsById={assetsById} />
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Title
              </label>
              <FormInput
                value={activePost.title}
                onChange={(e) => updateActive({ title: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Subtitle
              </label>
              <FormInput
                value={activePost.subtitle ?? ""}
                onChange={(e) => updateActive({ subtitle: e.target.value })}
                placeholder="Optional tagline"
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Content blocks</p>
              {activePost.blocks.map((block, index) => (
                <div
                  key={`${block.type}-${index}`}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {block.type.replace("-", " ")}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBlock(index)}
                      className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      Remove
                    </button>
                  </div>

                  {block.type === "text" || block.type === "heading" ? (
                    <FormTextArea
                      value={block.text}
                      onChange={(e) =>
                        updateBlock(index, { ...block, text: e.target.value })
                      }
                      rows={block.type === "heading" ? 2 : 4}
                      placeholder={block.type === "heading" ? "Section heading" : "Write your story…"}
                    />
                  ) : null}

                  {block.type === "image" ? (
                    <div className="space-y-2">
                      <div className="relative h-24 w-32 overflow-hidden rounded-lg">
                        {assetsById.get(block.assetId) ? (
                          <Image
                            src={assetsById.get(block.assetId)!.thumbUrl}
                            alt=""
                            fill
                            sizes="128px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Caption
                        </label>
                        <FormInput
                          value={block.caption ?? ""}
                          onChange={(e) =>
                            updateBlock(index, { ...block, caption: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  ) : null}

                  {block.type === "gallery-button" ? (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Button label
                      </label>
                      <FormInput
                        value={block.label ?? ""}
                        onChange={(e) =>
                          updateBlock(index, { ...block, label: e.target.value })
                        }
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={activePost.enableLightbox !== false}
                onChange={(e) => updateActive({ enableLightbox: e.target.checked })}
                className="rounded border-zinc-300"
              />
              Enable image lightbox for clients
            </label>
          </div>
        )}
      </div>
    );
  }

  const publishedCount = posts.filter((p) => p.status === "published").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Gallery blog</h3>
          <p className="mt-1 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
            Create editorial posts from gallery photos — clients see published stories in a Blog tab,
            similar to Pic-Time.
          </p>
        </div>
        <button
          type="button"
          disabled={busy || uploadRows.length === 0}
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-40"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add blog
        </button>
      </div>

      {uploadRows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Upload photos to this gallery first, then create a blog post from them.
        </p>
      ) : null}

      {posts.length > 0 ? (
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {publishedCount} published · {posts.length - publishedCount} draft
        </p>
      ) : null}

      <ul className="space-y-3">
        {posts.map((post) => (
          <li key={post.id}>
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand dark:bg-brand/20 dark:text-brand-on-dark">
                <FileText className="h-5 w-5" aria-hidden />
              </span>
              <button
                type="button"
                onClick={() => setActiveId(post.id)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{post.title}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {post.status === "published" ? "Published" : "Draft"} · {post.template}
                </p>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(post.id)}
                className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-900"
                aria-label={`Delete ${post.title}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
