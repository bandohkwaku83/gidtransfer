"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Download,
  ExternalLink,
  Lock,
  Unlock,
} from "lucide-react";
import {
  extendGalleryShare,
  getGallery,
  mergeGalleryDetail,
  patchGalleryShare,
  purgeGallery,
  restoreGallery,
  revokeGalleryShare,
} from "@/lib/admin/galleries";
import { getErrorMessage } from "@/lib/admin/admin-client";
import type { GalleryDetail } from "@/lib/admin/types";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { StatusChip } from "@/components/admin/ui/StatusChip";
import { formatDateTime, formatRelative } from "@/lib/admin/format";
import { useToast } from "@/lib/admin/use-admin-toast";

type ShareAction =
  | { type: "revoke" }
  | { type: "extend" }
  | { type: "downloads"; allowDownloads: boolean }
  | { type: "selection"; selectionLocked: boolean }
  | { type: "restore" }
  | { type: "purge" };

export default function GalleryDetailPage() {
  const router = useRouter();
  const { galleryId } = useParams<{ galleryId: string }>();
  const { toast } = useToast();
  const [gallery, setGallery] = useState<GalleryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState<ShareAction | null>(null);
  const [reason, setReason] = useState("");
  const [extendDays, setExtendDays] = useState("30");
  const [neverExpire, setNeverExpire] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    setLoading(true);
    getGallery(galleryId)
      .then((data) => {
        setGallery(data);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [galleryId]);

  const copyUrl = async () => {
    if (!gallery?.share.url) return;
    await navigator.clipboard.writeText(gallery.share.url);
    toast("Share URL copied");
  };

  const handleConfirm = async () => {
    if (!action || reason.trim().length < 3) {
      toast("Reason is required (min 3 characters)", "error");
      return;
    }
    setActionLoading(true);
    try {
      if (action.type === "revoke") {
        const patch = await revokeGalleryShare(galleryId, reason.trim());
        setGallery((current) =>
          current ? mergeGalleryDetail(current, patch) : current,
        );
        toast("Share link revoked");
      } else if (action.type === "extend") {
        const days = Number(extendDays);
        const patch = await extendGalleryShare(
          galleryId,
          neverExpire
            ? { reason: reason.trim(), days: null }
            : {
                reason: reason.trim(),
                extendDays: Number.isFinite(days) ? days : 30,
              },
        );
        setGallery((current) =>
          current ? mergeGalleryDetail(current, patch) : current,
        );
        toast(neverExpire ? "Share set to never expire" : "Share expiry extended");
      } else if (action.type === "downloads") {
        const patch = await patchGalleryShare(galleryId, {
          reason: reason.trim(),
          allowDownloads: action.allowDownloads,
        });
        setGallery((current) =>
          current ? mergeGalleryDetail(current, patch) : current,
        );
        toast("Download setting updated");
      } else if (action.type === "selection") {
        const patch = await patchGalleryShare(galleryId, {
          reason: reason.trim(),
          selectionLocked: action.selectionLocked,
        });
        setGallery((current) =>
          current ? mergeGalleryDetail(current, patch) : current,
        );
        toast("Selection lock updated");
      } else if (action.type === "restore") {
        await restoreGallery(galleryId, reason.trim());
        toast("Gallery restored");
        load();
      } else if (action.type === "purge") {
        await purgeGallery(galleryId, reason.trim());
        toast("Gallery permanently deleted");
        router.push("/admin/trash");
        return;
      }
      setAction(null);
      setReason("");
      setNeverExpire(false);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-zinc-200" />;
  }

  if (error || !gallery) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-2"
          onClick={() => router.push("/admin/galleries")}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <p className="text-sm text-red-600">{error || "Gallery not found"}</p>
      </div>
    );
  }

  const actionTitle =
    action?.type === "revoke"
      ? "Revoke share link"
      : action?.type === "extend"
        ? "Extend share expiry"
        : action?.type === "downloads"
          ? "Update downloads"
          : action?.type === "selection"
            ? "Update selection lock"
            : action?.type === "restore"
              ? "Restore gallery"
              : action?.type === "purge"
                ? "Permanently purge gallery"
                : "";

  return (
    <div className="space-y-6">
      <button
        type="button"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
        onClick={() => router.push("/admin/galleries")}
      >
        <ArrowLeft className="h-4 w-4" /> Back to galleries
      </button>

      <div className="card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900">
                {gallery.name}
              </h2>
              <StatusChip status={gallery.status} />
              {gallery.galleryTypeLabel && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {gallery.galleryTypeLabel}
                </span>
              )}
            </div>
            <p className="mt-1 font-mono text-sm text-slate-400">
              {gallery.slug}
            </p>
            {gallery.description && (
              <p className="mt-3 max-w-2xl text-sm text-slate-600">
                {gallery.description}
              </p>
            )}
          </div>
          <div className="text-sm text-slate-500">
            Updated {formatDateTime(gallery.updatedAt)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900">Studio</h3>
          <div className="mt-3 space-y-2 text-sm">
            <p className="font-medium text-slate-800">
              {gallery.studio.companyName || "—"}
            </p>
            <p className="text-slate-500">{gallery.studio.email}</p>
            <Link
              href={`/admin/photographers/${gallery.studio.userId}`}
              className="inline-flex text-primary hover:underline"
            >
              Open photographer
            </Link>
          </div>
          {gallery.photographerGalleryCounts && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(gallery.photographerGalleryCounts).map(
                ([key, value]) => (
                  <span
                    key={key}
                    className="rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600"
                  >
                    {key}: {value}
                  </span>
                ),
              )}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900">Share</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>
              Status:{" "}
              <strong>
                {gallery.share.isShared ? "Active" : "Not shared"}
              </strong>
            </p>
            <p>
              Password: {gallery.share.passwordProtected ? "Yes" : "No"}
            </p>
            <p>
              Expires:{" "}
              {gallery.share.shareExpiresAt
                ? `${formatDateTime(gallery.share.shareExpiresAt)} (${formatRelative(gallery.share.shareExpiresAt)})`
                : gallery.share.tokenPresent
                  ? "Never"
                  : "—"}
            </p>
            <p>Downloads: {gallery.share.allowDownloads ? "Allowed" : "Off"}</p>
          </div>
          {gallery.share.url && (
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn-secondary" onClick={copyUrl}>
                <Copy className="mr-1.5 inline h-3.5 w-3.5" />
                Copy URL
              </button>
              <a
                href={gallery.share.url}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                <ExternalLink className="mr-1.5 inline h-3.5 w-3.5" />
                Open
              </a>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {gallery.share.isShared && (
              <button
                type="button"
                className="btn-secondary text-red-600"
                onClick={() => setAction({ type: "revoke" })}
              >
                Revoke
              </button>
            )}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setAction({ type: "extend" })}
            >
              Extend
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setAction({
                  type: "downloads",
                  allowDownloads: !gallery.share.allowDownloads,
                })
              }
            >
              <Download className="mr-1 inline h-3.5 w-3.5" />
              {gallery.share.allowDownloads ? "Disable downloads" : "Allow downloads"}
            </button>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900">Selection</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>Client: {gallery.client?.name || "—"}</p>
            <p>
              Locked:{" "}
              <strong>{gallery.selection.locked ? "Yes" : "No"}</strong>
            </p>
            <p>
              Max selections:{" "}
              {gallery.selection.maxSelections ?? "Unlimited"}
            </p>
            <p>
              Submitted:{" "}
              {formatDateTime(gallery.selection.submittedAt)}
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary mt-4"
            onClick={() =>
              setAction({
                type: "selection",
                selectionLocked: !gallery.selection.locked,
              })
            }
          >
            {gallery.selection.locked ? (
              <>
                <Unlock className="mr-1 inline h-3.5 w-3.5" /> Unlock selection
              </>
            ) : (
              <>
                <Lock className="mr-1 inline h-3.5 w-3.5" /> Lock selection
              </>
            )}
          </button>

          {gallery.trash && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="font-medium text-amber-900">In trash</p>
              <p className="mt-1 text-amber-800">
                Deleted {formatDateTime(gallery.trash.deletedAt)}
              </p>
              <p className="text-amber-800">
                Deadline{" "}
                {gallery.trash.restoreDeadline
                  ? formatDateTime(gallery.trash.restoreDeadline)
                  : "—"}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={gallery.trash.restoreExpired}
                  onClick={() => setAction({ type: "restore" })}
                >
                  Restore
                </button>
                <button
                  type="button"
                  className="btn-secondary text-red-600"
                  onClick={() => setAction({ type: "purge" })}
                >
                  Purge
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!action}
        title={actionTitle}
        description={
          <div className="space-y-3">
            <p>This action is audited. Provide a reason (min 3 characters).</p>
            {action?.type === "extend" && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={neverExpire}
                    onChange={(e) => setNeverExpire(e.target.checked)}
                    className="rounded border-zinc-300"
                  />
                  Never expire
                </label>
                {!neverExpire && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700">
                      Extend by days
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={extendDays}
                      onChange={(e) => setExtendDays(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Why are you making this change?"
              />
            </div>
          </div>
        }
        confirmLabel="Confirm"
        destructive={action?.type === "revoke" || action?.type === "purge"}
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => {
          setAction(null);
          setReason("");
          setNeverExpire(false);
        }}
      />
    </div>
  );
}
