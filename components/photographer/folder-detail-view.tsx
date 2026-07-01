"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  ArrowLeft,
  Flag,
  ImageIcon,
  Images,
  Layers,
  Lock,
  MessageCircle,
} from "lucide-react";
import {
  ActiveFeedbackPanel,
  CustomizeGallerySidebar,
  FolderEditorChrome,
  FolderEditorTabBar,
  GalleryClientPreview,
  ClientSelectionLimitCard,
  SelectionFilterBar,
  ShareWithClientCard,
  WorkspaceSidebar,
  type ActiveFeedbackItem,
  type FolderEditorTab,
  type PreviewLayout,
  type PreviewViewport,
} from "@/components/photographer/folder-detail-editor-ui";
import { useToast } from "@/components/toast-provider";
import { FormInput } from "@/components/ui/form-input";
import { writeGalleryAccessClientConfig } from "@/lib/gallery-access-client-config";
import {
  readGalleryAccessEmails,
  writeGalleryEmailGateConfig,
  type GalleryAccessEmailEntry,
} from "@/lib/gallery-email-access";
import { generateGalleryAccessPin } from "@/lib/gallery-access-pin";
import {
  publicGalleryKeyFromToken,
  publicGallerySessionId,
  withGalleryImageCacheBust,
} from "@/lib/share-gallery-api";
import { cn } from "@/lib/utils";
import {
  getGalleriesMeta,
  getGalleryAnalytics,
  resolveMetaBodyFonts,
  resolveMetaCoverColorPresets,
  resolveMetaCoverFrames,
  resolveMetaGridLayouts,
  resolveMetaTitleFonts,
  type GalleriesMetaResponse,
} from "@/lib/galleries-api";
import { CoverFocalPreview } from "@/components/photographer/cover-focal-preview";
import {
  FolderUploadBulkToolbar,
  FolderUploadEmptyState,
  FolderUploadMediaGrid,
  FolderUploadOptionToggle,
  FolderUploadSectionHeader,
} from "@/components/photographer/folder-upload-grid";
import { GalleryDashboardPanel } from "@/components/photographer/gallery-dashboard-panel";
import { CreateFolderModal } from "@/components/photographer/create-folder-modal";
import { GallerySetBar } from "@/components/photographer/gallery-set-bar";
import {
  LockFinalModal,
  type LockFinalModalState,
} from "@/components/photographer/lock-final-modal";
import { UploadDragger } from "@/components/photographer/upload-dragger";
import {
  isFinalUploadableFile,
  isRawUploadableFile,
  RAW_UPLOAD_ACCEPT,
} from "@/lib/upload-folder-files";
import {
  DuplicateUploadConflictDialog,
  FALLBACK_COVER,
  statusLabel,
  UploadProgressBanner,
} from "@/components/photographer/folder-detail-bits";
import {
  FolderDetailPageSkeleton,
  InlineActionSkeleton,
} from "@/components/ui/skeletons";
import { MediaLightbox, lightboxMediaClass } from "@/components/ui/media-lightbox";
import {
  getFolderOverride,
  patchFolderOverride,
  type FolderStatus,
} from "@/lib/demo-data";
import {
  apiFolderMediaToDemoAsset,
  apiFolderMediaToFinal,
  demoAssetGridSrc,
  isLocalDemoFolderId,
} from "@/lib/folders/helpers";
import {
  galleryPhotoToApiFolderMedia,
  galleryPhotosPendingDerivatives,
  pollGalleryUploadDerivatives,
  upsertGalleryUploadRows,
  type GalleryUploadPhotosResult,
} from "@/lib/gallery-media-api";
import {
  extractFinalMediaList,
  extractRawMediaList,
  extractSelectionMediaList,
  apiFolderStatusToUi,
  folderSelectionLimit,
  getFolder,
  getFolderClientName,
  getFolderClientContact,
  getFolderCoverUrl,
  folderCoverObjectPositionStyle,
  FALLBACK_SHARE_EXPIRY_PRESETS,
  formatRestoreBeforeLabel,
  FoldersApiError,
  getFolderShareAbsoluteUrl,
  getShareLinkExpiryPresets,
  incomingFilenamesConflictingWithFolder,
  isGalleryPublished,
  canActivateGalleryOnline,
  galleryOnlineActivationHint,
  parseFolderCoverFocal,
  patchFolderFinalFeedbackReply,
  patchFolderSelectionFeedbackReply,
  patchFolderShare,
  patchFolderDesignSettings,
  patchFolderClientAccess,
  patchFolderStatus,
  patchFolderUploadSettings,
  patchFolderFinalSettings,
  deleteAllFolderFinalMedia,
  deleteAllFolderRawMedia,
  deleteFolder,
  deleteFolderBackgroundMusic,
  deleteFolderFinalMedia,
  deleteFolderRawMedia,
  postFolderMediaDuplicatePreview,
  regenerateFolderShare,
  revokeFolderShare,
  reorderFolderFinalMedia,
  reorderFolderRawMedia,
  applyOrderByIds,
  mergeVisibleOrder,
  patchFolderFinalLock,
  updateFolder,
  uploadFolderBackgroundMusic,
  uploadFolderFinalMedia,
  uploadFolderRawMedia,
  createFolderGallerySet,
  deleteFolderGallerySet,
  patchFolderSetsBarSettings,
  reorderFolderGallerySets,
  updateFolderGallerySet,
  type ApiFolder,
  type ApiFolderMedia,
  type DuplicateUploadAction,
  type FinalDeliveryUploadFields,
  type ShareLinkExpiryPreset,
  type UploadFolderFinalMediaFormOptions,
  type UploadFolderMediaFormOptions,
} from "@/lib/folders-api";
import { getDuplicateUploadPreference } from "@/lib/upload-preferences";
import {
  coverColorsMatch,
  normalizeGalleryCoverColor,
  resolveGalleryCoverButtonColor,
  resolveGalleryCoverTextColor,
} from "@/lib/gallery-cover-color";
import { normalizeGalleryCoverFrame, type GalleryCoverFrame } from "@/lib/gallery-cover-frame";
import { normalizeGalleryImageLayout } from "@/lib/gallery-image-layout";
import { getAuth } from "@/lib/auth-demo";
import { STUDIO_NAME } from "@/lib/branding";
import {
  filterMediaByGallerySet,
  buildSetsBarOrder,
  sortGallerySets,
  uploadSetIdForFilter,
  type GallerySetFilter,
} from "@/lib/gallery-set-filter";
import {
  buildGalleryAnalyticsSnapshot,
  collectGalleryActivityTimestamps,
  mapGalleryAnalyticsToSnapshot,
  type GalleryAnalyticsSnapshot,
} from "@/lib/gallery-analytics";
import { getSettings } from "@/lib/settings-api";
import {
  SETTINGS_PREREQUISITE_FOCUS,
  folderEditorReturnUrl,
  settingsPrerequisiteUrl,
} from "@/lib/settings-prerequisite";
// import { GalleryBlogEditorPanel } from "@/components/gallery-blog/gallery-blog-editor-panel";
// import { listGalleryBlogPosts } from "@/lib/gallery-blog";

function rawUploadFormOptions(
  duplicateAction: DuplicateUploadAction,
  setId?: string | null,
  applyPreviewWatermark?: boolean,
): UploadFolderMediaFormOptions {
  const opts: UploadFolderMediaFormOptions = {
    duplicateAction,
    markUploadComplete: true,
  };
  if (setId !== undefined) opts.setId = setId;
  if (applyPreviewWatermark !== undefined) opts.applyPreviewWatermark = applyPreviewWatermark;
  return opts;
}

function finalUploadFormOptions(
  duplicateAction: DuplicateUploadAction,
  files: File[],
  selectionMediaId: string | undefined,
  delivery: FinalDeliveryUploadFields,
  setId?: string | null,
  applyWatermark?: boolean,
): UploadFolderFinalMediaFormOptions {
  const opts: UploadFolderFinalMediaFormOptions = {
    duplicateAction,
    markUploadComplete: true,
    clientHasPaidForFinals: delivery.clientHasPaidForFinals,
  };
  if (setId !== undefined) opts.setId = setId;
  if (applyWatermark !== undefined) opts.applyWatermark = applyWatermark;
  if (files.length === 1 && selectionMediaId) {
    opts.selectionMediaId = selectionMediaId;
  }
  if (delivery.clientHasPaidForFinals === false) {
    if (delivery.amountRemainingGHS != null && String(delivery.amountRemainingGHS).trim() !== "") {
      opts.amountRemainingGHS = String(delivery.amountRemainingGHS).trim();
    }
    opts.lockImagesBeforeUpload = delivery.lockImagesBeforeUpload === true;
  }
  return opts;
}

const VIDEO_FILE_RE = /\.(mp4|mov|webm|m4v|avi|mkv|ogv)(?:[?#].*)?$/i;

async function fetchMediaAsCoverFile(url: string, name: string): Promise<File> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error("Could not load image.");
  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) {
    throw new Error("Cover must be a photo.");
  }
  const stem = name.replace(/\.[^.]+$/, "") || "cover";
  const ext =
    blob.type === "image/png" ? ".png" : blob.type === "image/webp" ? ".webp" : ".jpg";
  return new File([blob], `${stem}${ext}`, { type: blob.type });
}

function isFolderMediaVideo(item: {
  isVideo?: boolean;
  mimeType?: string;
  originalName?: string;
  name?: string;
  thumbUrl?: string;
  previewUrl?: string;
  url?: string;
}): boolean {
  if (item.isVideo) return true;
  if (item.mimeType?.toLowerCase().startsWith("video/")) return true;
  return [item.originalName, item.name, item.previewUrl, item.thumbUrl, item.url].some((value) =>
    VIDEO_FILE_RE.test(value ?? ""),
  );
}

function FolderMediaThumb({
  src,
  name,
  isVideo,
}: {
  src: string;
  name: string;
  isVideo: boolean;
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
        <img
          src={src}
          alt=""
          className="pointer-events-none h-full w-full object-cover"
          loading="lazy"
        />
      )}
      {isVideo ? (
        <span className="pointer-events-none absolute right-2 top-2 z-[5] rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Video
        </span>
      ) : null}
    </>
  );
}

type Tab = FolderEditorTab;

function formatFlaggedAt(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatSelectedAt(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function FolderDetailView({ folderId }: { folderId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [origin, setOrigin] = useState("");
  const [folder, setFolder] = useState<ApiFolder | null>(null);
  const [apiAnalytics, setApiAnalytics] = useState<GalleryAnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [imageLayoutDraft, setImageLayoutDraft] = useState<PreviewLayout>("masonry");
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
  const [titleFontDraft, setTitleFontDraft] = useState("Playfair Display");
  const [bodyFontDraft, setBodyFontDraft] = useState("Inter");
  const [allowDownloadsDraft, setAllowDownloadsDraft] = useState(true);
  const [passwordProtectionDraft, setPasswordProtectionDraft] = useState(false);
  const [emailGateDraft, setEmailGateDraft] = useState(false);
  const [galleryAccessEmails, setGalleryAccessEmails] = useState<GalleryAccessEmailEntry[]>([]);
  const [galleryAccessPinDraft, setGalleryAccessPinDraft] = useState("");
  const [accessPinCopied, setAccessPinCopied] = useState(false);
  const [selectionFilter, setSelectionFilter] = useState<"selected" | "comments">("selected");
  /** Shared set filter for raw uploads, client selections, and finals. */
  const [mediaSetFilter, setMediaSetFilter] = useState<GallerySetFilter>("all");
  const [setsBusy, setSetsBusy] = useState(false);
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [savingFeedbackId, setSavingFeedbackId] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    kind: "raw" | "final";
    phase: "preparing" | "uploading";
    computable: boolean;
    percent: number;
    fileIndex?: number;
    fileCount?: number;
  } | null>(null);
  const [expiryPresets, setExpiryPresets] = useState<ShareLinkExpiryPreset[]>([]);
  const [galleriesMeta, setGalleriesMeta] = useState<GalleriesMetaResponse | null>(null);
  const [linkExpiry, setLinkExpiry] = useState("30d");
  const [selectionLimitDraft, setSelectionLimitDraft] = useState("");
  const [savingSelectionSettings, setSavingSelectionSettings] = useState(false);
  /** `"raw:${id}"` | `"final:${id}"` while a delete request is in flight */
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  /** `"raw:${id}"` | `"final:${id}"` while setting cover from a tile */
  const [settingCoverKey, setSettingCoverKey] = useState<string | null>(null);
  /** Client-side display order for raw uploads / finals (no API). */
  const [rawOrderIds, setRawOrderIds] = useState<string[] | null>(null);
  const [finalOrderIds, setFinalOrderIds] = useState<string[] | null>(null);
  const [selectedRawIds, setSelectedRawIds] = useState<Set<string>>(() => new Set());
  const [selectedFinalIds, setSelectedFinalIds] = useState<Set<string>>(() => new Set());
  const rawSelectAllRef = useRef<HTMLInputElement>(null);
  const finalSelectAllRef = useRef<HTMLInputElement>(null);
  const musicFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const derivativesPollAbortRef = useRef<AbortController | null>(null);
  const derivativesBootstrappedRef = useRef<string | null>(null);

  const [focalEditOpen, setFocalEditOpen] = useState(false);
  const [focalDraft, setFocalDraft] = useState({ x: 50, y: 50 });
  const [coverFrameDraft, setCoverFrameDraft] = useState<GalleryCoverFrame>("full-bleed");
  const [coverColorDraft, setCoverColorDraft] = useState("#18181b");
  const [coverTextColorDraft, setCoverTextColorDraft] = useState("#ffffff");
  const [coverButtonColorDraft, setCoverButtonColorDraft] = useState("#ffffff");
  const [savingFocal, setSavingFocal] = useState(false);
  const [savingCoverFrame, setSavingCoverFrame] = useState(false);
  const [savingImageLayout, setSavingImageLayout] = useState(false);
  const [savingDesignFonts, setSavingDesignFonts] = useState(false);
  const [accessPinBusy, setAccessPinBusy] = useState(false);
  const [emailGateBusy, setEmailGateBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  /** Bust Next/Image and browser cache when the cover file changes at the same URL. */
  const [coverCacheBust, setCoverCacheBust] = useState<string | undefined>(undefined);

  /** After duplicate-preview: user chooses replace vs skip before uploading bytes. */
  const [musicBusy, setMusicBusy] = useState(false);

  const [duplicateFilenamePrompt, setDuplicateFilenamePrompt] = useState<null | {
    kind: "raw" | "final";
    files: File[];
    selectionMediaId?: string;
    conflictingNames: string[];
  }>(null);

  /** Carries payment/lock fields through duplicate-modal flows for final uploads. */
  const pendingFinalDeliveryRef = useRef<FinalDeliveryUploadFields | null>(null);

  const [finalWizardOpen, setFinalWizardOpen] = useState(false);
  const [finalWizardFiles, setFinalWizardFiles] = useState<File[]>([]);
  const [finalWizardStep, setFinalWizardStep] = useState<"choose" | "unpaid">("choose");
  const [finalWizardBalance, setFinalWizardBalance] = useState("");
  const [finalWizardLock, setFinalWizardLock] = useState(false);
  const [rawUploadPreviewWatermark, setRawUploadPreviewWatermark] = useState(true);
  const [finalUploadWatermark, setFinalUploadWatermark] = useState(false);
  const [studioWatermarkPreview, setStudioWatermarkPreview] = useState<boolean | null>(null);
  const [studioBrandWatermarkEnabled, setStudioBrandWatermarkEnabled] = useState<boolean | null>(null);
  const [savingUploadWatermark, setSavingUploadWatermark] = useState(false);
  const [savingFinalWatermark, setSavingFinalWatermark] = useState(false);
  const [lockFinalModal, setLockFinalModal] = useState<LockFinalModalState | null>(null);
  const [lockFinalBusyId, setLockFinalBusyId] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setOrigin(typeof window !== "undefined" ? window.location.origin : ""));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (
      tabParam === "dashboard" ||
      tabParam === "gallery" ||
      tabParam === "uploads" ||
      tabParam === "selection" ||
      tabParam === "finals" ||
      tabParam === "blog"
    ) {
      setTab(tabParam);
    }
  }, [folderId]);

  const refreshStudioWatermarkSettings = useCallback(() => {
    void getSettings().then((settings) => {
      setStudioWatermarkPreview(settings.watermarkPreviewImages);
      setStudioBrandWatermarkEnabled(settings.brandWatermark.enabled);
    });
  }, []);

  const effectiveRawUploadPreviewWatermark =
    studioWatermarkPreview !== false && rawUploadPreviewWatermark;
  const effectiveFinalUploadWatermark =
    studioBrandWatermarkEnabled !== false && finalUploadWatermark;

  useEffect(() => {
    refreshStudioWatermarkSettings();
  }, [refreshStudioWatermarkSettings]);

  useEffect(() => {
    function onFocus() {
      refreshStudioWatermarkSettings();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshStudioWatermarkSettings]);

  useEffect(() => {
    if (folder) {
      if (folder.watermarkPreviewEnabled !== undefined) {
        setRawUploadPreviewWatermark(folder.watermarkPreviewEnabled);
      }
      if (folder.watermarkFinalsEnabled !== undefined) {
        setFinalUploadWatermark(folder.watermarkFinalsEnabled);
      }
      return;
    }
    let cancelled = false;
    void getSettings().then((settings) => {
      if (cancelled) return;
      setRawUploadPreviewWatermark(settings.watermarkPreviewImages);
      setFinalUploadWatermark(settings.brandWatermark.enabled);
    });
    return () => {
      cancelled = true;
    };
  }, [folder?._id, folder?.watermarkPreviewEnabled, folder?.watermarkFinalsEnabled]);

  const goToPreviewWatermarkSettings = useCallback(() => {
    router.push(
      settingsPrerequisiteUrl({
        tab: "gallery",
        returnTo: folderEditorReturnUrl(folderId, "uploads"),
        focus: SETTINGS_PREREQUISITE_FOCUS.watermarkPreview,
      }),
    );
  }, [folderId, router]);

  const goToBrandWatermarkSettings = useCallback(() => {
    router.push(
      settingsPrerequisiteUrl({
        tab: "watermark",
        returnTo: folderEditorReturnUrl(folderId, "finals"),
        focus: SETTINGS_PREREQUISITE_FOCUS.brandWatermark,
      }),
    );
  }, [folderId, router]);

  const onRawUploadWatermarkChange = useCallback(
    async (checked: boolean) => {
      if (checked && studioWatermarkPreview === false) {
        goToPreviewWatermarkSettings();
        return;
      }
      const previous = rawUploadPreviewWatermark;
      setRawUploadPreviewWatermark(checked);
      setSavingUploadWatermark(true);
      try {
        const updated = await patchFolderUploadSettings(folderId, {
          watermarkPreviewEnabled: checked,
        });
        setFolder(updated);
      } catch (err) {
        setRawUploadPreviewWatermark(previous);
        showToast(
          err instanceof Error ? err.message : "Could not update preview watermark setting.",
          "error",
        );
      } finally {
        setSavingUploadWatermark(false);
      }
    },
    [folderId, goToPreviewWatermarkSettings, rawUploadPreviewWatermark, showToast, studioWatermarkPreview],
  );

  const onFinalUploadWatermarkChange = useCallback(
    async (checked: boolean) => {
      if (checked && studioBrandWatermarkEnabled === false) {
        goToBrandWatermarkSettings();
        return;
      }
      const previous = finalUploadWatermark;
      setFinalUploadWatermark(checked);
      setSavingFinalWatermark(true);
      try {
        const updated = await patchFolderFinalSettings(folderId, {
          watermarkFinalsEnabled: checked,
        });
        setFolder(updated);
      } catch (err) {
        setFinalUploadWatermark(previous);
        showToast(
          err instanceof Error ? err.message : "Could not update final watermark setting.",
          "error",
        );
      } finally {
        setSavingFinalWatermark(false);
      }
    },
    [folderId, finalUploadWatermark, goToBrandWatermarkSettings, showToast, studioBrandWatermarkEnabled],
  );

  const loadGalleryAnalytics = useCallback(async (id: string) => {
    try {
      const data = await getGalleryAnalytics(id);
      setApiAnalytics(mapGalleryAnalyticsToSnapshot(data));
    } catch {
      setApiAnalytics(null);
    }
  }, []);

  const refreshFolder = useCallback(async () => {
    const f = await getFolder(folderId);
    setFolder(f);
    void loadGalleryAnalytics(folderId);
    return f;
  }, [folderId, loadGalleryAnalytics]);

  const mergeRawUploadRows = useCallback(
    (rows: ReturnType<typeof galleryPhotoToApiFolderMedia>[]) => {
      setFolder((prev) => {
        if (!prev || rows.length === 0) return prev;
        return {
          ...prev,
          uploads: upsertGalleryUploadRows(extractRawMediaList(prev), rows),
        };
      });
    },
    [],
  );

  const startDerivativesPolling = useCallback(
    (photoIds: string[]) => {
      if (photoIds.length === 0 || isLocalDemoFolderId(folderId)) return;
      derivativesPollAbortRef.current?.abort();
      const ac = new AbortController();
      derivativesPollAbortRef.current = ac;
      void pollGalleryUploadDerivatives(
        folderId,
        photoIds,
        (photo) => {
          mergeRawUploadRows([galleryPhotoToApiFolderMedia(photo)]);
        },
        ac.signal,
      ).catch(() => {});
    },
    [folderId, mergeRawUploadRows],
  );

  const applyRawUploadComplete = useCallback(
    (body: unknown) => {
      if (!body || typeof body !== "object") return;
      const result = body as GalleryUploadPhotosResult;
      const photos = [...(result.created ?? []), ...(result.replaced ?? [])];
      if (photos.length === 0) return;
      mergeRawUploadRows(photos.map(galleryPhotoToApiFolderMedia));
      startDerivativesPolling(galleryPhotosPendingDerivatives(photos));
    },
    [mergeRawUploadRows, startDerivativesPolling],
  );

  useEffect(() => () => derivativesPollAbortRef.current?.abort(), []);

  useEffect(() => {
    derivativesBootstrappedRef.current = null;
    derivativesPollAbortRef.current?.abort();
  }, [folderId]);

  useEffect(() => {
    if (!folder || isLocalDemoFolderId(folder._id)) return;
    if (derivativesBootstrappedRef.current === folder._id) return;
    derivativesBootstrappedRef.current = folder._id;
    const pending = extractRawMediaList(folder)
      .filter((m) => m.derivativesReady === false)
      .map((m) => String(m.id ?? m._id ?? ""))
      .filter(Boolean);
    if (pending.length > 0) startDerivativesPolling(pending);
  }, [folder, startDerivativesPolling]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setApiAnalytics(null);
    (async () => {
      try {
        const [f, presets, meta] = await Promise.all([
          getFolder(folderId),
          getShareLinkExpiryPresets().catch(() => [] as ShareLinkExpiryPreset[]),
          getGalleriesMeta().catch(() => null),
        ]);
        if (cancelled) return;
        setFolder(f);
        void loadGalleryAnalytics(folderId);
        setGalleriesMeta(meta);
        const list = presets.length > 0 ? presets : FALLBACK_SHARE_EXPIRY_PRESETS;
        setExpiryPresets(list);
        const ids = list.map((p) => p.id);
        const fromShare = f.share?.linkExpiryPreset ?? undefined;
        setLinkExpiry((prev) => {
          if (fromShare && ids.includes(fromShare)) return fromShare;
          if (ids.includes(prev)) return prev;
          if (ids.includes("30d")) return "30d";
          return list[0]?.id ?? "30d";
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Folder not found.");
        setFolder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [folderId, loadGalleryAnalytics]);

  useEffect(() => {
    setFocalEditOpen(false);
  }, [folderId]);

  useEffect(() => {
    if (!folder) {
      setSelectionLimitDraft("");
      return;
    }
    const limit = folderSelectionLimit(folder);
    setSelectionLimitDraft(limit != null ? String(limit) : "");
    setCoverFrameDraft(normalizeGalleryCoverFrame(folder.coverFrame));
    const nextCoverColor = normalizeGalleryCoverColor(folder.coverColor);
    setCoverColorDraft(nextCoverColor);
    setCoverTextColorDraft(
      folder.coverTextColor?.trim()
        ? normalizeGalleryCoverColor(folder.coverTextColor)
        : resolveGalleryCoverTextColor(nextCoverColor),
    );
    setCoverButtonColorDraft(
      folder.coverButtonColor?.trim()
        ? normalizeGalleryCoverColor(folder.coverButtonColor)
        : resolveGalleryCoverButtonColor(nextCoverColor),
    );
    setImageLayoutDraft(
      normalizeGalleryImageLayout(folder.imageLayout ?? "masonry"),
    );
    setTitleFontDraft(folder.titleFont?.trim() || "Playfair Display");
    setBodyFontDraft(folder.bodyFont?.trim() || "Inter");
    if (folder.allowDownloads !== undefined) {
      setAllowDownloadsDraft(folder.allowDownloads);
    }
    const override = getFolderOverride(folder._id);
    setPasswordProtectionDraft(folder.sharePasswordEnabled ?? override?.sharePasswordEnabled ?? false);
    setEmailGateDraft(folder.emailGateEnabled ?? override?.emailGateEnabled ?? false);
    setGalleryAccessEmails(readGalleryAccessEmails(folder._id));
    if (override?.shareAccessPin) {
      setGalleryAccessPinDraft(override.shareAccessPin);
    }
  }, [folder]);

  useEffect(() => {
    if (!folder?._id) return;
    const refreshEmails = () => setGalleryAccessEmails(readGalleryAccessEmails(folder._id));
    const onStorage = (event: StorageEvent) => {
      if (!event.key?.includes(folder._id)) return;
      refreshEmails();
    };
    const onCustom = (event: Event) => {
      const detail = (event as CustomEvent<{ folderId?: string }>).detail;
      if (detail?.folderId === folder._id) refreshEmails();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("gidostorage-gallery-email-log", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("gidostorage-gallery-email-log", onCustom);
    };
  }, [folder?._id]);

  const shareAccessSessionId = useMemo(() => {
    const code = folder?.share?.code?.trim();
    if (!code) return null;
    return publicGallerySessionId(publicGalleryKeyFromToken(code));
  }, [folder?.share?.code]);

  const coverFrameOptions = useMemo(
    () => resolveMetaCoverFrames(galleriesMeta),
    [galleriesMeta],
  );
  const gridLayoutOptions = useMemo(
    () => resolveMetaGridLayouts(galleriesMeta),
    [galleriesMeta],
  );
  const coverColorPresets = useMemo(
    () => resolveMetaCoverColorPresets(galleriesMeta),
    [galleriesMeta],
  );
  const titleFontOptions = useMemo(
    () => resolveMetaTitleFonts(galleriesMeta),
    [galleriesMeta],
  );
  const bodyFontOptions = useMemo(
    () => resolveMetaBodyFonts(galleriesMeta),
    [galleriesMeta],
  );

  const syncShareAccessPreview = useCallback(
    (enabled: boolean, pin: string) => {
      if (!folder || !shareAccessSessionId) return;
      writeGalleryAccessClientConfig(shareAccessSessionId, {
        enabled,
        pin,
      });
      patchFolderOverride(folder._id, {
        sharePasswordEnabled: enabled,
        ...(pin ? { shareAccessPin: pin } : {}),
      });
    },
    [folder, shareAccessSessionId],
  );

  const syncEmailGatePreview = useCallback(
    (enabled: boolean) => {
      if (!folder || !shareAccessSessionId) return;
      writeGalleryEmailGateConfig(shareAccessSessionId, { enabled });
      patchFolderOverride(folder._id, { emailGateEnabled: enabled });
    },
    [folder, shareAccessSessionId],
  );

  const saveClientAccess = useCallback(
    async (patch: {
      passwordProtected?: boolean;
      password?: string;
      allowDownloads?: boolean;
      emailGateEnabled?: boolean;
    }) => {
      if (!folder) return;
      const busyEmail = patch.emailGateEnabled !== undefined;
      const busyAccess =
        patch.passwordProtected !== undefined ||
        patch.password !== undefined ||
        patch.allowDownloads !== undefined;
      if (busyEmail) setEmailGateBusy(true);
      if (busyAccess) setAccessPinBusy(true);
      try {
        const updated = await patchFolderClientAccess(folder._id, patch);
        setFolder(updated);
        if (patch.passwordProtected !== undefined || patch.password !== undefined) {
          const enabled =
            patch.passwordProtected ?? updated.sharePasswordEnabled ?? false;
          const pin = patch.password ?? galleryAccessPinDraft;
          syncShareAccessPreview(enabled, pin);
        }
        if (patch.emailGateEnabled !== undefined) {
          const enabled = patch.emailGateEnabled ?? updated.emailGateEnabled ?? false;
          setEmailGateDraft(enabled);
          syncEmailGatePreview(enabled);
        }
      } catch (e) {
        showToast(
          e instanceof FoldersApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not update client access.",
          "error",
        );
      } finally {
        if (busyEmail) setEmailGateBusy(false);
        if (busyAccess) setAccessPinBusy(false);
      }
    },
    [folder, galleryAccessPinDraft, showToast, syncEmailGatePreview, syncShareAccessPreview],
  );

  const onPasswordProtectionChange = useCallback(
    (enabled: boolean) => {
      setPasswordProtectionDraft(enabled);
      const pin = enabled ? galleryAccessPinDraft || generateGalleryAccessPin() : "";
      if (enabled && pin) {
        setGalleryAccessPinDraft(pin);
      }
      setAccessPinCopied(false);
      void saveClientAccess({
        passwordProtected: enabled,
        ...(enabled && pin ? { password: pin } : {}),
      });
    },
    [galleryAccessPinDraft, saveClientAccess],
  );

  const onEmailGateChange = useCallback(
    (enabled: boolean) => {
      setEmailGateDraft(enabled);
      void saveClientAccess({ emailGateEnabled: enabled });
    },
    [saveClientAccess],
  );

  const onRegenerateAccessPin = useCallback(() => {
    const pin = generateGalleryAccessPin();
    setGalleryAccessPinDraft(pin);
    setAccessPinCopied(false);
    showToast("New access code generated.", "success");
    void saveClientAccess({ passwordProtected: true, password: pin });
  }, [saveClientAccess, showToast]);

  const onAllowDownloadsChange = useCallback(
    (next: boolean) => {
      setAllowDownloadsDraft(next);
      void saveClientAccess({ allowDownloads: next });
    },
    [saveClientAccess],
  );

  const onCopyAccessPin = useCallback(async () => {
    const pin = galleryAccessPinDraft;
    if (!pin) return;
    try {
      await navigator.clipboard.writeText(pin);
      setAccessPinCopied(true);
      showToast("Access code copied.", "success");
      window.setTimeout(() => setAccessPinCopied(false), 2000);
    } catch {
      showToast("Could not copy code.", "error");
    }
  }, [galleryAccessPinDraft, showToast]);

  const shareUrl = useMemo(() => {
    if (!folder) return "";
    const raw = folder.shareUrl?.trim() ?? "";
    if (!raw) return "";
    // Share links from the API are already in the correct format (tenant route).
    // Only assemble when the API gave us a relative path.
    if (/^https?:\/\//i.test(raw)) return raw;
    if (origin) return getFolderShareAbsoluteUrl(folder, origin) ?? raw;
    return raw;
  }, [folder, origin]);
  const shareActive = useMemo(
    () => (folder ? isGalleryPublished(folder) : false),
    [folder],
  );

  const galleryOnlineHint = useMemo(
    () => (folder ? galleryOnlineActivationHint(folder) : "Turn on to publish the client link."),
    [folder],
  );

  const folderStatus = useMemo(
    () => (folder ? apiFolderStatusToUi(folder.status) : "DRAFT" satisfies FolderStatus),
    [folder],
  );

  useEffect(() => {
    setRawOrderIds(null);
    setFinalOrderIds(null);
  }, [folderId]);

  const rawAssets = useMemo(() => {
    const base = folder ? extractRawMediaList(folder).map(apiFolderMediaToDemoAsset) : [];
    return rawOrderIds ? applyOrderByIds(base, rawOrderIds) : base;
  }, [folder, rawOrderIds]);

  const finalAssets = useMemo(() => {
    const base = folder ? extractFinalMediaList(folder).map(apiFolderMediaToFinal) : [];
    return finalOrderIds ? applyOrderByIds(base, finalOrderIds) : base;
  }, [folder, finalOrderIds]);

  const flaggedFinalItems = useMemo(
    () => {
      const override = getFolderOverride(folderId);
      return (folder?.flaggedFinals ?? []).map((m) => {
        const final = apiFolderMediaToFinal(m);
        return {
          ...final,
          comment: (m.clientComment || m.comment || "").trim(),
          photographerReply:
            (m.photographerReply || "").trim() ||
            override?.feedbackReplies?.[`fin:${final.id}`]?.trim() ||
            "",
          flaggedAt: m.flaggedAt ?? null,
        };
      });
    },
    [folder, folderId],
  );

  const flaggedFinalIdSet = useMemo(
    () => new Set(flaggedFinalItems.map((item) => item.id)),
    [flaggedFinalItems],
  );

  /** Count of per-final payment locks (for summary chip in finals tab). */
  const lockedFinalCount = useMemo(
    () => finalAssets.filter((f) => f.locked).length,
    [finalAssets],
  );

  const patchFinalInFolder = useCallback((updated: ApiFolderMedia) => {
    const updatedId = updated.id ?? updated._id;
    if (!updatedId) return;
    setFolder((prev) => {
      if (!prev) return prev;
      const finals = (prev.finals ?? []).map((m) => {
        const id = m.id ?? m._id;
        return id === updatedId ? { ...m, ...updated } : m;
      });
      return { ...prev, finals };
    });
  }, []);

  const selectionRows = useMemo(
    () => (folder ? extractSelectionMediaList(folder).map(apiFolderMediaToDemoAsset) : []),
    [folder],
  );

  const clientSelectedAssets = useMemo(() => {
    const picked = selectionRows.filter((a) => a.selection === "SELECTED");
    return picked.length > 0 ? picked : selectionRows;
  }, [selectionRows]);

  const selectionWithComments = useMemo(
    () => clientSelectedAssets.filter((a) => (a.clientComment ?? "").trim().length > 0),
    [clientSelectedAssets],
  );

  const galleryPublished = useMemo(
    () => (folder ? isGalleryPublished(folder) : false),
    [folder],
  );

  const fallbackGalleryAnalytics = useMemo(
    () =>
      buildGalleryAnalyticsSnapshot({
        viewCount: Number(folder?.share?.viewCount ?? 0),
        downloadCount: Number(folder?.share?.downloadCount ?? 0),
        uploadsCount: rawAssets.length,
        selectionsCount: clientSelectedAssets.length,
        finalsCount: finalAssets.length,
        activityTimestamps: collectGalleryActivityTimestamps(
          folder,
          clientSelectedAssets.map((a) => a.selectedAt),
        ),
        referenceIso: folder?.updatedAt ?? null,
      }),
    [folder, rawAssets.length, clientSelectedAssets, finalAssets.length],
  );

  const galleryAnalytics = apiAnalytics ?? fallbackGalleryAnalytics;

  const filteredSelectionAssets = useMemo(() => {
    if (selectionFilter === "comments") return selectionWithComments;
    return clientSelectedAssets;
  }, [selectionFilter, clientSelectedAssets, selectionWithComments]);

  const gallerySets = useMemo(
    () => sortGallerySets(folder?.sets ?? []),
    [folder?.sets],
  );

  const filteredRawAssets = useMemo(
    () => filterMediaByGallerySet(rawAssets, mediaSetFilter),
    [rawAssets, mediaSetFilter],
  );

  const filteredSelectionBySet = useMemo(
    () => filterMediaByGallerySet(filteredSelectionAssets, mediaSetFilter),
    [filteredSelectionAssets, mediaSetFilter],
  );

  const filteredFinalAssets = useMemo(
    () => filterMediaByGallerySet(finalAssets, mediaSetFilter),
    [finalAssets, mediaSetFilter],
  );

  const mediaUploadSetId = useMemo(
    () => uploadSetIdForFilter(mediaSetFilter),
    [mediaSetFilter],
  );

  const setBarCountItems = useMemo(() => {
    if (tab === "uploads") return rawAssets;
    if (tab === "selection") return filteredSelectionAssets;
    if (tab === "finals") return finalAssets;
    return [];
  }, [tab, rawAssets, filteredSelectionAssets, finalAssets]);

  const setBarCountLabel = useMemo(() => {
    if (tab === "uploads") return "raw uploads";
    if (tab === "selection") return "client selections";
    if (tab === "finals") return "finals";
    return "";
  }, [tab]);

  const showMediaTabs = tab === "uploads" || tab === "selection" || tab === "finals";

  /** Set id for new uploads; omitted on All so files are not forced into a subsection. */
  const resolveUploadSetId = useCallback((): string | undefined => {
    if (mediaSetFilter === "all") return undefined;
    return mediaUploadSetId;
  }, [mediaSetFilter, mediaUploadSetId]);

  const handleCreateGallerySet = useCallback(
    async (name: string) => {
      if (!folder) return;
      setSetsBusy(true);
      try {
        const created = await createFolderGallerySet(folder._id, name);
        await refreshFolder();
        setMediaSetFilter(created.id);
        showToast(`Set “${created.name}” created — active on all media tabs.`, "success");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Could not create set.", "error");
        throw e;
      } finally {
        setSetsBusy(false);
      }
    },
    [folder, refreshFolder, showToast],
  );

  const handleRenameGallerySet = useCallback(
    async (setId: string, name: string) => {
      if (!folder) return;
      setSetsBusy(true);
      try {
        await updateFolderGallerySet(folder._id, setId, { name });
        await refreshFolder();
        showToast("Set renamed.", "success");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Could not rename set.", "error");
        throw e;
      } finally {
        setSetsBusy(false);
      }
    },
    [folder, refreshFolder, showToast],
  );

  const handleRenameAllSetsPill = useCallback(
    async (label: string) => {
      if (!folder) return;
      setSetsBusy(true);
      try {
        await patchFolderSetsBarSettings(folder._id, { setsAllLabel: label });
        await refreshFolder();
        showToast("All tab renamed.", "success");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Could not rename All tab.", "error");
        throw e;
      } finally {
        setSetsBusy(false);
      }
    },
    [folder, refreshFolder, showToast],
  );

  const handleDeleteGallerySet = useCallback(
    async (setId: string) => {
      if (!folder) return;
      const label = gallerySets.find((s) => s.id === setId)?.name ?? "this set";
      if (
        !window.confirm(
          `Delete “${label}”? Photos in this set will stay in the gallery but won’t belong to any set.`,
        )
      ) {
        return;
      }
      setSetsBusy(true);
      try {
        await deleteFolderGallerySet(folder._id, setId);
        await refreshFolder();
        setMediaSetFilter((prev) => (prev === setId ? "all" : prev));
        showToast("Set deleted.", "success");
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Could not delete set.", "error");
      } finally {
        setSetsBusy(false);
      }
    },
    [folder, gallerySets, refreshFolder, showToast],
  );

  const handleReorderGallerySets = useCallback(
    async (orderedIds: string[]) => {
      if (!folder) return;
      const previousOrder = buildSetsBarOrder(gallerySets, folder.setsAllSortOrder);
      if (orderedIds.join("|") === previousOrder.join("|")) return;

      setSetsBusy(true);
      try {
        await reorderFolderGallerySets(folder._id, orderedIds);
        await refreshFolder();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Could not reorder sets.", "error");
        throw e;
      } finally {
        setSetsBusy(false);
      }
    },
    [folder, gallerySets, refreshFolder, showToast],
  );

  const activeFeedbackCandidates = useMemo((): ActiveFeedbackItem[] => {
    if (!folder) return [];
    const author = getFolderClientName(folder);
    const fromSelections = clientSelectedAssets
      .filter((a) => (a.clientComment ?? "").trim())
      .map((a) => ({
        id: `sel:${a.id}`,
        name: a.originalName,
        thumbUrl: a.previewUrl ?? a.thumbUrl,
        author,
        timeLabel: "Client selection",
        comment: (a.clientComment ?? "").trim(),
        photographerReply: (a.photographerReply ?? "").trim(),
      }));
    const fromFlagged = flaggedFinalItems.map((item) => ({
      id: `fin:${item.id}`,
      name: item.name,
      thumbUrl: item.url,
      author,
      timeLabel: formatFlaggedAt(item.flaggedAt) || "Recently",
      comment: item.comment || "No comment provided.",
      photographerReply: (item.photographerReply ?? "").trim(),
    }));
    if (tab === "selection") return fromSelections;
    if (tab === "finals") return fromFlagged;
    return [...fromFlagged, ...fromSelections];
  }, [clientSelectedAssets, flaggedFinalItems, folder, tab]);

  const saveFeedbackReply = useCallback(
    async (itemId: string, reply: string) => {
      setSavingFeedbackId(itemId);
      try {
        if (itemId.startsWith("sel:")) {
          await patchFolderSelectionFeedbackReply(folderId, itemId.slice(4), reply);
        } else if (itemId.startsWith("fin:")) {
          await patchFolderFinalFeedbackReply(folderId, itemId.slice(4), reply);
        }
        await refreshFolder();
        showToast(reply ? "Reply sent to client." : "Reply removed.", "success");
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : "Could not save reply.",
          "error",
        );
      } finally {
        setSavingFeedbackId(null);
      }
    },
    [folderId, refreshFolder, showToast],
  );

  const focusFeedbackThread = useCallback((feedbackId: string) => {
    setActiveFeedbackId(feedbackId);
    requestAnimationFrame(() => {
      document
        .getElementById(`feedback-thread-${feedbackId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  type FolderLightboxItem = { id: string; name: string; src: string; isVideo: boolean };
  const lightboxNavItems = useMemo((): FolderLightboxItem[] => {
    if (tab === "gallery") return [];
    if (tab === "uploads") {
      return filteredRawAssets.map((a) => ({
        id: a.id,
        name: a.originalName,
        src: demoAssetGridSrc(a),
        isVideo: isFolderMediaVideo(a),
      }));
    }
    if (tab === "selection") {
      return filteredSelectionBySet.map((a) => ({
        id: a.id,
        name: a.originalName,
        src: demoAssetGridSrc(a),
        isVideo: isFolderMediaVideo(a),
      }));
    }
    return filteredFinalAssets.map((f) => ({
      id: f.id,
      name: f.name,
      src: f.url,
      isVideo: isFolderMediaVideo(f),
    }));
  }, [tab, filteredRawAssets, filteredSelectionBySet, filteredFinalAssets]);

  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);

  useEffect(() => {
    setLightboxId(null);
    setLightboxZoom(1);
  }, [tab]);

  const lbNavIndex = lightboxId
    ? lightboxNavItems.findIndex((item) => item.id === lightboxId)
    : -1;
  const lbItem = lbNavIndex >= 0 ? lightboxNavItems[lbNavIndex] : null;

  useEffect(() => {
    if (!lightboxId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxId(null);
        setLightboxZoom(1);
        return;
      }
      const target = e.target as HTMLElement | null;
      if (
        target?.closest("input, textarea, select") ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.key === "ArrowLeft" && lbNavIndex > 0) {
        e.preventDefault();
        const prev = lightboxNavItems[lbNavIndex - 1];
        if (prev) {
          setLightboxId(prev.id);
          setLightboxZoom(1);
        }
      } else if (
        e.key === "ArrowRight" &&
        lbNavIndex >= 0 &&
        lbNavIndex < lightboxNavItems.length - 1
      ) {
        e.preventDefault();
        const next = lightboxNavItems[lbNavIndex + 1];
        if (next) {
          setLightboxId(next.id);
          setLightboxZoom(1);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxId, lbNavIndex, lightboxNavItems]);

  useEffect(() => {
    if (lightboxId && lbNavIndex < 0) {
      setLightboxId(null);
      setLightboxZoom(1);
    }
  }, [lightboxId, lbNavIndex]);

  const rawIdsKey = useMemo(
    () => filteredRawAssets.map((a) => a.id).sort().join("\0"),
    [filteredRawAssets],
  );
  const finalIdsKey = useMemo(
    () => filteredFinalAssets.map((f) => f.id).sort().join("\0"),
    [filteredFinalAssets],
  );

  useEffect(() => {
    setSelectedRawIds(new Set());
    setSelectedFinalIds(new Set());
  }, [folderId]);

  useEffect(() => {
    setSelectedRawIds((prev) => {
      const valid = new Set(filteredRawAssets.map((a) => a.id));
      const next = new Set<string>();
      for (const id of prev) {
        if (valid.has(id)) next.add(id);
      }
      if (next.size === prev.size && [...prev].every((id) => next.has(id))) return prev;
      return next;
    });
  }, [rawIdsKey, filteredRawAssets]);

  useEffect(() => {
    setSelectedFinalIds((prev) => {
      const valid = new Set(filteredFinalAssets.map((f) => f.id));
      const next = new Set<string>();
      for (const id of prev) {
        if (valid.has(id)) next.add(id);
      }
      if (next.size === prev.size && [...prev].every((id) => next.has(id))) return prev;
      return next;
    });
  }, [finalIdsKey, filteredFinalAssets]);

  const rawAllSelected =
    filteredRawAssets.length > 0 &&
    filteredRawAssets.every((a) => selectedRawIds.has(a.id));
  const rawSomeSelected = selectedRawIds.size > 0 && !rawAllSelected;
  const finalAllSelected =
    filteredFinalAssets.length > 0 &&
    filteredFinalAssets.every((f) => selectedFinalIds.has(f.id));
  const finalSomeSelected = selectedFinalIds.size > 0 && !finalAllSelected;

  useEffect(() => {
    const el = rawSelectAllRef.current;
    if (el) el.indeterminate = rawSomeSelected;
  }, [rawSomeSelected]);

  useEffect(() => {
    const el = finalSelectAllRef.current;
    if (el) el.indeterminate = finalSomeSelected;
  }, [finalSomeSelected]);

  const uploadProgressHandler = useCallback(
    (kind: "raw" | "final") =>
      (
        loaded: number,
        total: number,
        lengthComputable: boolean,
        batch?: { fileIndex: number; fileCount: number },
      ) => {
        const canCompute = lengthComputable && total > 0;
        /** Until at least one byte is reported, keep indeterminate — avoids an empty 0% bar. */
        const showDeterminate = canCompute && loaded > 0;
        const rounded = canCompute
          ? Math.min(100, Math.round((100 * loaded) / total))
          : 0;
        const percent =
          showDeterminate && rounded < 1 ? 1 : showDeterminate ? rounded : 0;
        setUploadProgress((prev) => ({
          kind,
          phase: "uploading",
          computable: showDeterminate,
          percent,
          fileIndex:
            batch?.fileIndex ??
            (prev?.phase === "uploading" && prev.fileIndex !== undefined ? prev.fileIndex : undefined),
          fileCount:
            batch?.fileCount ??
            (prev?.phase === "uploading" && prev.fileCount !== undefined ? prev.fileCount : undefined),
        }));
      },
    [],
  );

  const mergeFinalFormOpts = useCallback(
    (
      dup: DuplicateUploadAction,
      files: File[],
      selectionMediaId?: string,
    ): UploadFolderFinalMediaFormOptions => {
      const d = pendingFinalDeliveryRef.current;
      return finalUploadFormOptions(
        dup,
        files,
        selectionMediaId,
        d ?? { clientHasPaidForFinals: true },
        resolveUploadSetId(),
        effectiveFinalUploadWatermark,
      );
    },
    [effectiveFinalUploadWatermark, resolveUploadSetId],
  );

  function openFinalUploadWizard(files: File[]) {
    if (!folder || busy || files.length === 0) return;
    setFinalWizardFiles(files);
    setFinalWizardStep("choose");
    setFinalWizardBalance("");
    setFinalWizardLock(false);
    setFinalWizardOpen(true);
  }

  async function executeFinalUploadPipeline(files: File[], delivery: FinalDeliveryUploadFields) {
    if (!folder || files.length === 0) return;
    pendingFinalDeliveryRef.current = delivery;
    setBusy(true);
    setUploadProgress({ kind: "final", phase: "preparing", computable: false, percent: 0 });
    let awaitingConflictChoice = false;
    const selectionMediaId: string | undefined = undefined;
    try {
      const dupPreview = await postFolderMediaDuplicatePreview(folder._id, {
        kind: "final",
        filenames: files.map((f) => f.name),
      });
      if (dupPreview.hasConflicts) {
        awaitingConflictChoice = true;
        const conflictingNames =
          dupPreview.conflictingFilenames && dupPreview.conflictingFilenames.length > 0
            ? dupPreview.conflictingFilenames
            : incomingFilenamesConflictingWithFolder(
                "final",
                files.map((f) => f.name),
                folder,
              );
        setDuplicateFilenamePrompt({
          kind: "final",
          files,
          selectionMediaId,
          conflictingNames,
        });
        return;
      }

      setUploadProgress({
        kind: "final",
        phase: "uploading",
        computable: false,
        percent: 0,
        fileIndex: 1,
        fileCount: files.length,
      });
      await uploadFolderFinalMedia(
        folder._id,
        files,
        uploadProgressHandler("final"),
        mergeFinalFormOpts(getDuplicateUploadPreference(), files, selectionMediaId),
      );
      await refreshFolder();
      showToast(
        delivery.clientHasPaidForFinals
          ? `${files.length} final(s) uploaded.`
          : `${files.length} final(s) uploaded. Outstanding balance noted — client may receive SMS.`,
        "success",
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Upload failed.", "error");
    } finally {
      setUploadProgress(null);
      if (!awaitingConflictChoice) {
        setBusy(false);
        pendingFinalDeliveryRef.current = null;
      }
    }
  }

  async function onUnlockFinal(finalId: string) {
    if (!folder || lockFinalBusyId || busy) return;
    if (
      !window.confirm(
        "Unlock this final for client download? Any outstanding balance will be cleared.",
      )
    ) {
      return;
    }
    setLockFinalBusyId(finalId);
    try {
      const updated = await patchFolderFinalLock(folder._id, finalId, { isLocked: false });
      patchFinalInFolder(updated);
      showToast("Final unlocked for client download.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not unlock final.", "error");
    } finally {
      setLockFinalBusyId(null);
    }
  }

  function openLockFinalModal(finalId: string) {
    const target = finalAssets.find((f) => f.id === finalId);
    if (!target) return;
    setLockFinalModal({
      finalId,
      amount:
        target.outstandingBalanceGhs != null && target.outstandingBalanceGhs > 0
          ? String(target.outstandingBalanceGhs)
          : "",
    });
  }

  async function onConfirmLockFinal() {
    if (!folder || !lockFinalModal || lockFinalBusyId) return;
    const target = finalAssets.find((f) => f.id === lockFinalModal.finalId);
    const raw = lockFinalModal.amount.trim().replace(/,/g, "");
    const hasStored =
      target?.outstandingBalanceGhs != null && target.outstandingBalanceGhs > 0;
    if (!raw && !hasStored) {
      showToast("Enter a valid amount owing in GHS.", "error");
      return;
    }
    let amountOwing: number | undefined;
    if (raw) {
      if (Number.isNaN(Number(raw))) {
        showToast("Enter a valid amount owing in GHS.", "error");
        return;
      }
      const n = Number(raw);
      if (n < 0) {
        showToast("Amount cannot be negative.", "error");
        return;
      }
      amountOwing = n;
    }
    setLockFinalBusyId(lockFinalModal.finalId);
    try {
      const updated = await patchFolderFinalLock(folder._id, lockFinalModal.finalId, {
        isLocked: true,
        amountOwing,
      });
      patchFinalInFolder(updated);
      setLockFinalModal(null);
      showToast("Final locked — client sees preview only until paid.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not lock final.", "error");
    } finally {
      setLockFinalBusyId(null);
    }
  }

  async function onRawUpload(files: File[]) {
    if (!folder || busy || files.length === 0) return;
    const setId = resolveUploadSetId();
    setBusy(true);
    setUploadProgress({ kind: "raw", phase: "preparing", computable: false, percent: 0 });
    let awaitingConflictChoice = false;
    try {
      const dupPreview = await postFolderMediaDuplicatePreview(folder._id, {
        kind: "raw",
        filenames: files.map((f) => f.name),
      });
      if (dupPreview.hasConflicts) {
        awaitingConflictChoice = true;
        const conflictingNames =
          dupPreview.conflictingFilenames && dupPreview.conflictingFilenames.length > 0
            ? dupPreview.conflictingFilenames
            : incomingFilenamesConflictingWithFolder(
                "raw",
                files.map((f) => f.name),
                folder,
              );
        setDuplicateFilenamePrompt({ kind: "raw", files, conflictingNames });
        return;
      }

      setUploadProgress({
        kind: "raw",
        phase: "uploading",
        computable: false,
        percent: 0,
        fileIndex: 1,
        fileCount: files.length,
      });
      const uploadResult = await uploadFolderRawMedia(
        folder._id,
        files,
        uploadProgressHandler("raw"),
        rawUploadFormOptions(getDuplicateUploadPreference(), setId, effectiveRawUploadPreviewWatermark),
      );
      applyRawUploadComplete(uploadResult?.lastBody);
      void refreshFolder();
      showToast(`${files.length} file(s) uploaded.`, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Upload failed.", "error");
    } finally {
      setUploadProgress(null);
      if (!awaitingConflictChoice) setBusy(false);
    }
  }

  function onDuplicatePromptCancel() {
    setDuplicateFilenamePrompt(null);
    setUploadProgress(null);
    setBusy(false);
    pendingFinalDeliveryRef.current = null;
  }

  async function onDuplicatePromptReplace() {
    const p = duplicateFilenamePrompt;
    if (!folder || !p) return;
    setDuplicateFilenamePrompt(null);
    setBusy(true);
    setUploadProgress({
      kind: p.kind,
      phase: "uploading",
      computable: false,
      percent: 0,
      fileIndex: 1,
      fileCount: p.files.length,
    });
    try {
      if (p.kind === "raw") {
        const uploadResult = await uploadFolderRawMedia(
          folder._id,
          p.files,
          uploadProgressHandler("raw"),
          rawUploadFormOptions("replace", resolveUploadSetId(), effectiveRawUploadPreviewWatermark),
        );
        applyRawUploadComplete(uploadResult?.lastBody);
        void refreshFolder();
      } else {
        await uploadFolderFinalMedia(
          folder._id,
          p.files,
          uploadProgressHandler("final"),
          mergeFinalFormOpts("replace", p.files, p.selectionMediaId),
        );
        await refreshFolder();
      }
      showToast(
        p.kind === "raw"
          ? `${p.files.length} file(s) uploaded (replacing matching names).`
          : `${p.files.length} final(s) uploaded (replacing matching names).`,
        "success",
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Upload failed.", "error");
    } finally {
      setUploadProgress(null);
      setBusy(false);
      pendingFinalDeliveryRef.current = null;
    }
  }

  async function onDuplicatePromptSkip() {
    const p = duplicateFilenamePrompt;
    if (!folder || !p) return;

    const conflictSet = new Set(p.conflictingNames);
    /** When we know which names collide, omit them from the request entirely (saves time and bandwidth). */
    const canFilterLocally = p.conflictingNames.length > 0;
    const filesToUpload = canFilterLocally
      ? p.files.filter((f) => !conflictSet.has(f.name))
      : p.files;
    const skippedWithoutUpload = canFilterLocally ? p.files.length - filesToUpload.length : 0;

    setDuplicateFilenamePrompt(null);

    if (filesToUpload.length === 0) {
      setUploadProgress(null);
      setBusy(false);
      pendingFinalDeliveryRef.current = null;
      showToast(
        p.kind === "raw"
          ? "Nothing to upload — those filenames are already in raw uploads."
          : "Nothing to upload — those filenames are already in finals.",
        "success",
      );
      return;
    }

    setBusy(true);
    setUploadProgress({
      kind: p.kind,
      phase: "uploading",
      computable: false,
      percent: 0,
      fileIndex: 1,
      fileCount: filesToUpload.length,
    });
    try {
      let ignored = 0;
      if (p.kind === "raw") {
        const result = await uploadFolderRawMedia(
          folder._id,
          filesToUpload,
          uploadProgressHandler("raw"),
          rawUploadFormOptions("ignore", resolveUploadSetId(), effectiveRawUploadPreviewWatermark),
        );
        applyRawUploadComplete(result?.lastBody);
        ignored = result?.ignoredDuplicatesCount ?? 0;
        void refreshFolder();
      } else {
        const result = await uploadFolderFinalMedia(
          folder._id,
          filesToUpload,
          uploadProgressHandler("final"),
          mergeFinalFormOpts("ignore", filesToUpload, p.selectionMediaId),
        );
        ignored = result?.ignoredDuplicatesCount ?? 0;
        await refreshFolder();
      }
      if (skippedWithoutUpload > 0) {
        showToast(
          ignored > 0
            ? p.kind === "raw"
              ? `Uploaded ${filesToUpload.length} new file(s); ${skippedWithoutUpload} duplicate name(s) were not sent. Server also skipped ${ignored}.`
              : `Uploaded ${filesToUpload.length} new final(s); ${skippedWithoutUpload} duplicate name(s) were not sent. Server also skipped ${ignored}.`
            : p.kind === "raw"
              ? `Uploaded ${filesToUpload.length} new file(s); ${skippedWithoutUpload} duplicate name(s) were not sent.`
              : `Uploaded ${filesToUpload.length} new final(s); ${skippedWithoutUpload} duplicate name(s) were not sent.`,
          "success",
        );
      } else {
        showToast(
          ignored > 0
            ? p.kind === "raw"
              ? `Uploaded; ${ignored} duplicate filename(s) skipped.`
              : `Uploaded; ${ignored} duplicate final name(s) skipped.`
            : p.kind === "raw"
              ? `${filesToUpload.length} file(s) uploaded.`
              : `${filesToUpload.length} final(s) uploaded.`,
          "success",
        );
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Upload failed.", "error");
    } finally {
      setUploadProgress(null);
      setBusy(false);
      pendingFinalDeliveryRef.current = null;
    }
  }

  async function onRegenerateLink() {
    if (!folder || busy) return;
    setBusy(true);
    try {
      const { folder: updated, smsError } = await regenerateFolderShare(folder._id, {
        clearSlug: false,
        linkExpiry: linkExpiry || undefined,
      });
      setFolder(updated);
      if (smsError?.message?.trim()) {
        showToast(`Link created, but SMS failed: ${smsError.message.trim()}`, "info");
      } else {
        showToast("Share link regenerated.", "success");
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not regenerate link.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function onToggleGalleryOnline(
    nextOnline: boolean,
    options?: { notifyClientViaSms?: boolean },
  ) {
    if (!folder || busy) return;
    if (nextOnline && !canActivateGalleryOnline(folder)) {
      showToast(galleryOnlineActivationHint(folder), "error");
      return;
    }
    setBusy(true);
    try {
      const result = nextOnline
        ? await regenerateFolderShare(folder._id, {
            clearSlug: false,
            linkExpiry: linkExpiry || undefined,
            notifyClientViaSms: options?.notifyClientViaSms,
          })
        : { folder: await revokeFolderShare(folder._id) };
      setFolder(result.folder);
      if (nextOnline && result.smsError?.message?.trim()) {
        showToast(`Gallery is online, but SMS failed: ${result.smsError.message.trim()}`, "info");
      } else {
        showToast(
          nextOnline ? "Gallery is now online." : "Gallery is now offline.",
          "success",
        );
      }
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Could not update gallery status.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  async function markCompleted() {
    if (!folder || busy || folderStatus === "COMPLETED") return;
    setBusy(true);
    try {
      const updated = await patchFolderStatus(folder._id, "completed");
      setFolder(updated);
      showToast("Marked as completed.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not update status.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function moveToTrash() {
    if (!folder || busy) return;
    const trashTitle = folder.eventName?.trim() || getFolderClientName(folder);
    if (
      !window.confirm(
        `Move gallery "${trashTitle}" to trash? You can restore it from Trash before the deadline.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const result = await deleteFolder(folder._id);
      const deadline = formatRestoreBeforeLabel(result.restoreBefore);
      showToast(
        deadline
          ? `Gallery moved to trash. Restore by ${deadline}.`
          : result.message,
        "success",
      );
      router.push("/dashboard/galleries");
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not move gallery to trash.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveSelectionLimit() {
    if (!folder || savingSelectionSettings || busy) return;
    const trimmed = selectionLimitDraft.trim();
    let next: number | null = null;
    if (trimmed !== "") {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 1) {
        showToast("Enter a whole number of at least 1, or leave blank for unlimited.", "error");
        return;
      }
      next = Math.floor(n);
    }
    const current = folderSelectionLimit(folder);
    if (current === next) return;

    setSavingSelectionSettings(true);
    try {
      const updated = await patchFolderShare(folder._id, { selectionLimit: next });
      setFolder(updated);
      showToast(
        next == null
          ? "Client selection limit removed (unlimited)."
          : `Clients can select up to ${next} photo${next === 1 ? "" : "s"}.`,
        "success",
      );
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not update selection limit.",
        "error",
      );
    } finally {
      setSavingSelectionSettings(false);
    }
  }

  async function saveCoverFocal() {
    if (!folder || savingFocal) return;
    setSavingFocal(true);
    try {
      const updated = await updateFolder(folder._id, {
        coverFocalX: focalDraft.x,
        coverFocalY: focalDraft.y,
      });
      setFolder(updated);
      showToast("Cover framing saved.", "success");
      setFocalEditOpen(false);
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not save cover framing.",
        "error",
      );
    } finally {
      setSavingFocal(false);
    }
  }

  function openFocalEditor() {
    if (!folder) return;
    setFocalDraft(parseFolderCoverFocal(folder));
    setFocalEditOpen(true);
  }

  const saveCoverFrame = useCallback(async (options?: { silent?: boolean }) => {
    if (!folder || savingCoverFrame) return;
    const nextFrame = normalizeGalleryCoverFrame(coverFrameDraft);
    const nextColor = normalizeGalleryCoverColor(coverColorDraft);
    const nextTextColor = normalizeGalleryCoverColor(coverTextColorDraft);
    const nextButtonColor = normalizeGalleryCoverColor(coverButtonColorDraft);
    setSavingCoverFrame(true);
    try {
      const updated = await patchFolderDesignSettings(folder._id, {
        coverFrame: nextFrame,
        coverColor: nextColor,
        coverTextColor: nextTextColor,
        coverButtonColor: nextButtonColor,
      });
      setFolder(updated);
      if (!options?.silent) {
        showToast("Client cover design saved.", "success");
      }
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not save cover design.",
        "error",
      );
    } finally {
      setSavingCoverFrame(false);
    }
  }, [folder, savingCoverFrame, coverFrameDraft, coverColorDraft, coverTextColorDraft, coverButtonColorDraft, showToast]);

  const coverStyleDirtyForSave = useMemo(() => {
    if (!folder) return false;
    const activeFrame = normalizeGalleryCoverFrame(folder.coverFrame);
    const activeColor = normalizeGalleryCoverColor(folder.coverColor);
    const activeTextColor = folder.coverTextColor?.trim()
      ? normalizeGalleryCoverColor(folder.coverTextColor)
      : resolveGalleryCoverTextColor(activeColor);
    const activeButtonColor = folder.coverButtonColor?.trim()
      ? normalizeGalleryCoverColor(folder.coverButtonColor)
      : resolveGalleryCoverButtonColor(activeColor);
    return (
      coverFrameDraft !== activeFrame ||
      !coverColorsMatch(coverColorDraft, activeColor) ||
      !coverColorsMatch(coverTextColorDraft, activeTextColor) ||
      !coverColorsMatch(coverButtonColorDraft, activeButtonColor)
    );
  }, [folder, coverFrameDraft, coverColorDraft, coverTextColorDraft, coverButtonColorDraft]);

  useEffect(() => {
    if (!folder || !coverStyleDirtyForSave || savingCoverFrame || focalEditOpen) return;
    const timer = window.setTimeout(() => {
      void saveCoverFrame({ silent: true });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [
    folder,
    coverStyleDirtyForSave,
    savingCoverFrame,
    focalEditOpen,
    saveCoverFrame,
  ]);

  const saveImageLayout = useCallback(async (options?: { silent?: boolean }) => {
    if (!folder || savingImageLayout) return;
    const nextLayout = normalizeGalleryImageLayout(imageLayoutDraft);
    setSavingImageLayout(true);
    try {
      const updated = await patchFolderDesignSettings(folder._id, {
        imageLayout: nextLayout,
      });
      setFolder(updated);
      if (!options?.silent) {
        showToast("Client grid layout saved.", "success");
      }
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not save grid layout.",
        "error",
      );
    } finally {
      setSavingImageLayout(false);
    }
  }, [folder, savingImageLayout, imageLayoutDraft, showToast]);

  const imageLayoutDirtyForSave = useMemo(() => {
    if (!folder) return false;
    const active = normalizeGalleryImageLayout(folder.imageLayout ?? "masonry");
    return normalizeGalleryImageLayout(imageLayoutDraft) !== active;
  }, [folder, imageLayoutDraft]);

  useEffect(() => {
    if (!folder || !imageLayoutDirtyForSave || savingImageLayout || focalEditOpen) return;
    const timer = window.setTimeout(() => {
      void saveImageLayout({ silent: true });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [
    folder,
    imageLayoutDirtyForSave,
    savingImageLayout,
    focalEditOpen,
    saveImageLayout,
  ]);

  const saveDesignFonts = useCallback(async (options?: { silent?: boolean }) => {
    if (!folder || savingDesignFonts) return;
    const nextTitle = titleFontDraft.trim() || "Playfair Display";
    const nextBody = bodyFontDraft.trim() || "Inter";
    const activeTitle = folder.titleFont?.trim() || "Playfair Display";
    const activeBody = folder.bodyFont?.trim() || "Inter";
    if (nextTitle === activeTitle && nextBody === activeBody) return;

    setSavingDesignFonts(true);
    try {
      const updated = await patchFolderDesignSettings(folder._id, {
        titleFont: nextTitle,
        bodyFont: nextBody,
      });
      setFolder(updated);
      if (!options?.silent) {
        showToast("Typography saved.", "success");
      }
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not save typography.",
        "error",
      );
    } finally {
      setSavingDesignFonts(false);
    }
  }, [folder, savingDesignFonts, titleFontDraft, bodyFontDraft, showToast]);

  const designFontsDirtyForSave = useMemo(() => {
    if (!folder) return false;
    const activeTitle = folder.titleFont?.trim() || "Playfair Display";
    const activeBody = folder.bodyFont?.trim() || "Inter";
    const nextTitle = titleFontDraft.trim() || "Playfair Display";
    const nextBody = bodyFontDraft.trim() || "Inter";
    return nextTitle !== activeTitle || nextBody !== activeBody;
  }, [folder, titleFontDraft, bodyFontDraft]);

  useEffect(() => {
    if (!folder || !designFontsDirtyForSave || savingDesignFonts || focalEditOpen) return;
    const timer = window.setTimeout(() => {
      void saveDesignFonts({ silent: true });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [
    folder,
    designFontsDirtyForSave,
    savingDesignFonts,
    focalEditOpen,
    saveDesignFonts,
  ]);

  function cancelFocalEditor() {
    setFocalEditOpen(false);
  }

  async function onCoverFileChange(ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.currentTarget.files?.[0] ?? null;
    ev.currentTarget.value = "";
    if (!folder || !file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Choose an image file for the gallery cover.", "error");
      return;
    }

    setCoverBusy(true);
    try {
      const updated = await updateFolder(folder._id, {
        coverImage: file,
        useDefaultCover: false,
        coverFocalX: 50,
        coverFocalY: 50,
      });
      setFolder(updated);
      setFocalDraft(parseFolderCoverFocal(updated));
      setCoverCacheBust(String(Date.now()));
      showToast("Cover image updated.", "success");
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not update cover image.",
        "error",
      );
    } finally {
      setCoverBusy(false);
    }
  }

  async function onSetCoverFromMedia(mediaId: string, source: "raw" | "final") {
    if (!folder || coverBusy || settingCoverKey) return;

    if (source === "raw") {
      const asset = rawAssets.find((item) => item.id === mediaId);
      if (!asset) return;
      if (isFolderMediaVideo(asset)) {
        showToast("Cover must be a photo.", "error");
        return;
      }
      const url = asset.previewUrl ?? asset.thumbUrl;
      if (!url) {
        showToast("Could not load image for cover.", "error");
        return;
      }

      setSettingCoverKey(`raw:${mediaId}`);
      setCoverBusy(true);
      try {
        const file = await fetchMediaAsCoverFile(url, asset.originalName);
        const updated = await updateFolder(folder._id, {
          coverImage: file,
          useDefaultCover: false,
          coverFocalX: 50,
          coverFocalY: 50,
        });
        setFolder(updated);
        setFocalDraft(parseFolderCoverFocal(updated));
        setCoverCacheBust(String(Date.now()));
        showToast("Cover image updated.", "success");
      } catch (e) {
        showToast(
          e instanceof FoldersApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not update cover image.",
          "error",
        );
      } finally {
        setCoverBusy(false);
        setSettingCoverKey(null);
      }
      return;
    }

    const asset = finalAssets.find((item) => item.id === mediaId);
    if (!asset) return;
    if (isFolderMediaVideo(asset)) {
      showToast("Cover must be a photo.", "error");
      return;
    }
    if (!asset.url) {
      showToast("Could not load image for cover.", "error");
      return;
    }

    setSettingCoverKey(`final:${mediaId}`);
    setCoverBusy(true);
    try {
      const file = await fetchMediaAsCoverFile(asset.url, asset.name);
      const updated = await updateFolder(folder._id, {
        coverImage: file,
        useDefaultCover: false,
        coverFocalX: 50,
        coverFocalY: 50,
      });
      setFolder(updated);
      setFocalDraft(parseFolderCoverFocal(updated));
      setCoverCacheBust(String(Date.now()));
      showToast("Cover image updated.", "success");
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not update cover image.",
        "error",
      );
    } finally {
      setCoverBusy(false);
      setSettingCoverKey(null);
    }
  }

  async function onBackgroundMusicFileChange(ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file || !folder) return;
    setMusicBusy(true);
    try {
      const updated = await uploadFolderBackgroundMusic(folder._id, file);
      setFolder(updated);
      showToast("Background music uploaded.", "success");
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not upload audio.",
        "error",
      );
    } finally {
      setMusicBusy(false);
    }
  }

  async function onRemoveBackgroundMusic() {
    if (!folder) return;
    const hasTrack = Boolean(folder.backgroundMusicUrl || folder.backgroundMusic);
    if (!hasTrack) return;
    if (!confirm("Remove background music from this gallery?")) return;
    setMusicBusy(true);
    try {
      const updated = await deleteFolderBackgroundMusic(folder._id);
      setFolder(updated);
      showToast("Background music removed.", "success");
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not remove audio.",
        "error",
      );
    } finally {
      setMusicBusy(false);
    }
  }

  async function onToggleBackgroundMusicForClients(next: boolean) {
    if (!folder || musicBusy) return;
    setMusicBusy(true);
    try {
      const updated = await updateFolder(folder._id, { backgroundMusicEnabled: next });
      setFolder(updated);
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not update setting.",
        "error",
      );
    } finally {
      setMusicBusy(false);
    }
  }

  function mediaDeleteBlocked() {
    return busy || uploadProgress !== null || deletingKey !== null || settingCoverKey !== null;
  }

  function toggleRawSelected(mediaId: string) {
    if (mediaDeleteBlocked()) return;
    setSelectedRawIds((prev) => {
      const next = new Set(prev);
      if (next.has(mediaId)) next.delete(mediaId);
      else next.add(mediaId);
      return next;
    });
  }

  function toggleFinalSelected(mediaId: string) {
    if (mediaDeleteBlocked()) return;
    setSelectedFinalIds((prev) => {
      const next = new Set(prev);
      if (next.has(mediaId)) next.delete(mediaId);
      else next.add(mediaId);
      return next;
    });
  }

  function setRawSelectAll(select: boolean) {
    if (mediaDeleteBlocked()) return;
    setSelectedRawIds(
      select ? new Set(filteredRawAssets.map((a) => a.id)) : new Set(),
    );
  }

  function setFinalSelectAll(select: boolean) {
    if (mediaDeleteBlocked()) return;
    setSelectedFinalIds(
      select ? new Set(filteredFinalAssets.map((f) => f.id)) : new Set(),
    );
  }

  const onReorderRawMedia = useCallback(
    (visibleOrderedIds: string[]) => {
      if (!folder || mediaDeleteBlocked() || busy) return;
      const previousOrder =
        rawOrderIds ?? rawAssets.map((asset) => asset.id);
      const nextOrder = mergeVisibleOrder(previousOrder, visibleOrderedIds);
      if (nextOrder.join("|") === previousOrder.join("|")) return;

      setRawOrderIds(nextOrder);
      void (async () => {
        try {
          const updated = await reorderFolderRawMedia(folder._id, nextOrder);
          setFolder(updated);
          setRawOrderIds(null);
        } catch (e) {
          setRawOrderIds(previousOrder);
          showToast(
            e instanceof FoldersApiError
              ? e.message
              : e instanceof Error
                ? e.message
                : "Could not save photo order.",
            "error",
          );
        }
      })();
    },
    [busy, folder, rawAssets, rawOrderIds, mediaDeleteBlocked, showToast],
  );

  const onReorderFinalMedia = useCallback(
    (visibleOrderedIds: string[]) => {
      if (!folder || mediaDeleteBlocked() || busy) return;
      const previousOrder =
        finalOrderIds ?? finalAssets.map((asset) => asset.id);
      const nextOrder = mergeVisibleOrder(previousOrder, visibleOrderedIds);
      if (nextOrder.join("|") === previousOrder.join("|")) return;

      setFinalOrderIds(nextOrder);
      void (async () => {
        try {
          const updated = await reorderFolderFinalMedia(folder._id, nextOrder);
          setFolder(updated);
          setFinalOrderIds(null);
        } catch (e) {
          setFinalOrderIds(previousOrder);
          showToast(
            e instanceof FoldersApiError
              ? e.message
              : e instanceof Error
                ? e.message
                : "Could not save final order.",
            "error",
          );
        }
      })();
    },
    [busy, folder, finalAssets, finalOrderIds, mediaDeleteBlocked, showToast],
  );

  async function onDeleteRawAsset(mediaId: string) {
    if (!folder || mediaDeleteBlocked()) return;
    if (
      !confirm(
        "Move this file to trash? It will disappear from the gallery but can be restored until the deadline.",
      )
    ) {
      return;
    }
    setDeletingKey(`raw:${mediaId}`);
    try {
      const result = await deleteFolderRawMedia(folder._id, mediaId);
      await refreshFolder();
      setSelectedRawIds((prev) => {
        if (!prev.has(mediaId)) return prev;
        const next = new Set(prev);
        next.delete(mediaId);
        return next;
      });
      const deadline = formatRestoreBeforeLabel(result.restoreBefore);
      showToast(
        deadline ? `${result.message} Restore by ${deadline}.` : result.message,
        "success",
      );
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not move file to trash.",
        "error",
      );
    } finally {
      setDeletingKey(null);
    }
  }

  async function onDeleteFinalAsset(mediaId: string) {
    if (!folder || mediaDeleteBlocked()) return;
    if (
      !confirm(
        "Move this final to trash? It will disappear from the gallery but can be restored until the deadline.",
      )
    ) {
      return;
    }
    setDeletingKey(`final:${mediaId}`);
    try {
      const result = await deleteFolderFinalMedia(folder._id, mediaId);
      await refreshFolder();
      setSelectedFinalIds((prev) => {
        if (!prev.has(mediaId)) return prev;
        const next = new Set(prev);
        next.delete(mediaId);
        return next;
      });
      const deadline = formatRestoreBeforeLabel(result.restoreBefore);
      showToast(
        deadline ? `${result.message} Restore by ${deadline}.` : result.message,
        "success",
      );
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not move final to trash.",
        "error",
      );
    } finally {
      setDeletingKey(null);
    }
  }

  async function onDeleteAllRaw() {
    if (!folder || mediaDeleteBlocked() || rawAssets.length === 0) return;
    if (
      !confirm(
        `Move all ${rawAssets.length} raw upload(s) to trash? They will leave the gallery but stay recoverable until the deadline.`,
      )
    ) {
      return;
    }
    setDeletingKey("raw:all");
    try {
      const result = await deleteAllFolderRawMedia(folder._id);
      await refreshFolder();
      setSelectedRawIds(new Set());
      const deadline = formatRestoreBeforeLabel(result.restoreBefore);
      showToast(
        deadline
          ? `${result.deletedCount} file(s) moved to trash. Restore by ${deadline}.`
          : result.message,
        "success",
      );
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not move raw uploads to trash.",
        "error",
      );
    } finally {
      setDeletingKey(null);
    }
  }

  async function onDeleteAllFinals() {
    if (!folder || mediaDeleteBlocked() || finalAssets.length === 0) return;
    if (
      !confirm(
        `Move all ${finalAssets.length} final(s) to trash? They will leave the gallery but stay recoverable until the deadline.`,
      )
    ) {
      return;
    }
    setDeletingKey("final:all");
    try {
      const result = await deleteAllFolderFinalMedia(folder._id);
      await refreshFolder();
      setSelectedFinalIds(new Set());
      const deadline = formatRestoreBeforeLabel(result.restoreBefore);
      showToast(
        deadline
          ? `${result.deletedCount} final(s) moved to trash. Restore by ${deadline}.`
          : result.message,
        "success",
      );
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not move finals to trash.",
        "error",
      );
    } finally {
      setDeletingKey(null);
    }
  }

  async function onDeleteSelectedRaw() {
    if (!folder || mediaDeleteBlocked()) return;
    const ids = rawAssets.map((a) => a.id).filter((id) => selectedRawIds.has(id));
    if (ids.length === 0) return;
    if (
      !confirm(
        `Move ${ids.length} selected image(s) to trash? They will disappear from the gallery but can be restored until the deadline.`,
      )
    ) {
      return;
    }
    setDeletingKey("raw:bulk");
    try {
      let restoreBefore = "";
      if (ids.length === rawAssets.length) {
        const result = await deleteAllFolderRawMedia(folder._id);
        restoreBefore = result.restoreBefore;
      } else {
        for (const id of ids) {
          const r = await deleteFolderRawMedia(folder._id, id);
          if (r.restoreBefore) restoreBefore = r.restoreBefore;
        }
      }
      await refreshFolder();
      setSelectedRawIds(new Set());
      const deadline = formatRestoreBeforeLabel(restoreBefore);
      showToast(
        deadline
          ? `${ids.length} file(s) moved to trash. Restore by ${deadline}.`
          : ids.length === 1
            ? "File moved to trash."
            : `${ids.length} files moved to trash.`,
        "success",
      );
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not move selected files to trash.",
        "error",
      );
      await refreshFolder().catch(() => {});
    } finally {
      setDeletingKey(null);
    }
  }

  async function onDeleteSelectedFinals() {
    if (!folder || mediaDeleteBlocked()) return;
    const ids = finalAssets.map((f) => f.id).filter((id) => selectedFinalIds.has(id));
    if (ids.length === 0) return;
    if (
      !confirm(
        `Move ${ids.length} selected final(s) to trash? They will disappear from the gallery but can be restored until the deadline.`,
      )
    ) {
      return;
    }
    setDeletingKey("final:bulk");
    try {
      let restoreBefore = "";
      if (ids.length === finalAssets.length) {
        const result = await deleteAllFolderFinalMedia(folder._id);
        restoreBefore = result.restoreBefore;
      } else {
        for (const id of ids) {
          const r = await deleteFolderFinalMedia(folder._id, id);
          if (r.restoreBefore) restoreBefore = r.restoreBefore;
        }
      }
      await refreshFolder();
      setSelectedFinalIds(new Set());
      const deadline = formatRestoreBeforeLabel(restoreBefore);
      showToast(
        deadline
          ? `${ids.length} final(s) moved to trash. Restore by ${deadline}.`
          : ids.length === 1
            ? "Final moved to trash."
            : `${ids.length} finals moved to trash.`,
        "success",
      );
    } catch (e) {
      showToast(
        e instanceof FoldersApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not move selected finals to trash.",
        "error",
      );
      await refreshFolder().catch(() => {});
    } finally {
      setDeletingKey(null);
    }
  }

  if (loading) {
    return <FolderDetailPageSkeleton />;
  }

  if (error || !folder) {
    return (
      <div className="dashboard-page flex justify-center py-12">
      <div className="flex w-full max-w-lg flex-col items-center rounded-3xl border border-zinc-200 bg-white px-8 py-14 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
          <Layers className="h-7 w-7 text-zinc-400" aria-hidden />
        </div>
        <p className="mt-5 text-base font-medium text-zinc-900 dark:text-zinc-100">
          Couldn&apos;t open this gallery
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {error ?? "Folder not found."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard/galleries"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All galleries
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Dashboard
          </Link>
        </div>
      </div>
      </div>
    );
  }

  const clientName = getFolderClientName(folder);
  const clientHasPhone = Boolean(getFolderClientContact(folder));
  const title = folder.eventName?.trim() || clientName;
  const coverUrl = getFolderCoverUrl(folder);
  const coverSrc = coverUrl
    ? withGalleryImageCacheBust(coverUrl, coverCacheBust ?? folder.updatedAt)
    : FALLBACK_COVER;
  const hasCover = Boolean(coverUrl);
  const studioName = getAuth()?.user?.studio?.companyName?.trim() || STUDIO_NAME;
  const eventDateLabel = new Date(folder.eventDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const focalSaved = parseFolderCoverFocal(folder);
  const previewFocal = focalEditOpen ? focalDraft : focalSaved;
  const selectionLimitHelper =
    folderSelectionLimit(folder) != null
      ? `Clients can heart-select up to ${folderSelectionLimit(folder)} photo${
          folderSelectionLimit(folder) === 1 ? "" : "s"
        }.`
      : "Leave blank for unlimited client selections.";
  async function onCopyShareLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1500);
    } catch {
      showToast("Could not copy link.", "error");
    }
  }

  const uploadsSidebar = (
    <WorkspaceSidebar>
      <ClientSelectionLimitCard
        selectionLimitDraft={selectionLimitDraft}
        onSelectionLimitDraftChange={setSelectionLimitDraft}
        onSave={() => void saveSelectionLimit()}
        saving={savingSelectionSettings}
        busy={busy}
        helperText={selectionLimitHelper}
      />
      <ShareWithClientCard
        title={title}
        clientName={clientName}
        eventDateLabel={eventDateLabel}
        shareUrl={shareUrl}
        shareActive={shareActive}
        linkCopied={linkCopied}
        busy={busy}
        onCopy={() => void onCopyShareLink()}
        onRegenerate={onRegenerateLink}
      />
    </WorkspaceSidebar>
  );

  const feedbackSidebar = (
    <WorkspaceSidebar>
      <ActiveFeedbackPanel
        items={activeFeedbackCandidates}
        title={tab === "finals" ? "Flagged feedback" : "Selection feedback"}
        subtitle={tab === "finals" ? "Client revision notes on finals" : "Client comments on selected photos"}
        emptyMessage={
          tab === "selection"
            ? "No client comments yet. When they add a note on a selected photo, it will appear here."
            : "No flagged finals yet. When a client flags a final for revision, it will appear here."
        }
        tip={
          tab === "selection"
            ? "Tip: ask clients to add notes on specific picks so you know what to retouch."
            : "Tip: flagged finals are great for collecting revision notes in one place."
        }
        onSaveReply={saveFeedbackReply}
        savingItemId={savingFeedbackId}
        activeItemId={activeFeedbackId}
        photographerLabel={studioName || "You"}
      />
    </WorkspaceSidebar>
  );

  return (
    <div className="dashboard-page space-y-6 pb-12">
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(ev) => void onCoverFileChange(ev)}
      />
      <input
        ref={musicFileInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac,.opus,.webm,application/ogg"
        className="sr-only"
        onChange={(ev) => void onBackgroundMusicFileChange(ev)}
      />

      <div className="space-y-0">
        <FolderEditorChrome
          title={title}
          eventDateLabel={eventDateLabel}
          clientName={clientName}
          folderStatus={folderStatus}
          busy={busy}
          shareActive={shareActive}
          shareUrl={shareUrl}
          linkCopied={linkCopied}
          onCopyShare={() => void onCopyShareLink()}
          onRegenerateLink={() => void onRegenerateLink()}
          onMarkCompleted={() => void markCompleted()}
          onEdit={() => setEditOpen(true)}
          onMoveToTrash={() => void moveToTrash()}
        />

        <FolderEditorTabBar
        tab={tab}
        onTabChange={setTab}
        counts={{
          uploads: rawAssets.length,
          selection: clientSelectedAssets.length,
          finals: finalAssets.length,
          // blog: folder
          //   ? listGalleryBlogPosts(folder._id).filter((p) => p.status === "published").length
          //   : 0,
        }}
        showPreviewToggle={tab === "gallery"}
        previewViewport={previewViewport}
        onPreviewViewportChange={setPreviewViewport}
        />

        {showMediaTabs ? (
          <GallerySetBar
            className="mt-3"
            sets={gallerySets}
            allSetsLabel={folder?.setsAllLabel}
            allSetsSortOrder={folder?.setsAllSortOrder}
            filter={mediaSetFilter}
            onFilterChange={setMediaSetFilter}
            items={setBarCountItems}
            onCreateSet={handleCreateGallerySet}
            onRenameSet={handleRenameGallerySet}
            onRenameAllSets={handleRenameAllSetsPill}
            onDeleteSet={handleDeleteGallerySet}
            onReorderSets={handleReorderGallerySets}
            busy={busy || setsBusy}
            countContext={setBarCountLabel || undefined}
            showUploadHint={tab === "uploads"}
          />
        ) : null}
      </div>

      {uploadProgress ? (
        <UploadProgressBanner
          kind={uploadProgress.kind}
          phase={uploadProgress.phase}
          computable={uploadProgress.computable}
          percent={uploadProgress.percent}
          fileIndex={uploadProgress.fileIndex}
          fileCount={uploadProgress.fileCount}
        />
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1 space-y-5">
          {tab === "dashboard" ? (
            <GalleryDashboardPanel
              published={galleryPublished}
              shareExpired={folder.shareExpired}
              sharedAt={folder.share?.sharedAt}
              uploadsCount={rawAssets.length}
              finalsCount={finalAssets.length}
              commentsCount={selectionWithComments.length}
              flaggedFinalsCount={flaggedFinalItems.length}
              selectionLimit={folder ? folderSelectionLimit(folder) : null}
              shareActive={shareActive}
              shareUrl={shareUrl}
              linkCopied={linkCopied}
              passwordProtection={passwordProtectionDraft}
              finalImagesLocked={lockedFinalCount > 0}
              analytics={galleryAnalytics}
              statusBusy={busy}
              activationHint={galleryOnlineHint}
              clientHasPhone={clientHasPhone}
              onNavigateTab={setTab}
              onCopyShare={() => void onCopyShareLink()}
              onOnlineChange={(next, options) => void onToggleGalleryOnline(next, options)}
            />
          ) : null}

          {tab === "gallery" ? (
            <GalleryClientPreview
              coverSrc={coverSrc}
              hasCover={hasCover}
              title={title}
              coverFrame={coverFrameDraft}
              coverColor={coverColorDraft}
              coverTextColor={coverTextColorDraft}
              coverButtonColor={coverButtonColorDraft}
              focalX={previewFocal.x}
              focalY={previewFocal.y}
              previewLayout={imageLayoutDraft}
              previewViewport={previewViewport}
              titleFont={titleFontDraft}
              bodyFont={bodyFontDraft}
            />
          ) : null}

        {tab === "uploads" ? (
          <div className="space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
            <FolderUploadSectionHeader
              icon={Images}
              title="Raw uploads"
              description="Upload raw files into the active set chosen above."
              count={rawAssets.length}
            />
            <FolderUploadOptionToggle
              checked={rawUploadPreviewWatermark}
              onChange={(checked) => void onRawUploadWatermarkChange(checked)}
              disabled={busy || savingUploadWatermark}
              label="Add preview watermark"
              hint="Watermarks client-facing previews for new raw uploads."
              prerequisiteMet={studioWatermarkPreview !== false}
              prerequisiteMessage="Turn on Watermark preview images in Gallery defaults first."
              onPrerequisiteNeeded={goToPreviewWatermarkSettings}
            />
            <UploadDragger
              compact={rawAssets.length > 0}
              label={rawAssets.length > 0 ? "Add more files" : "Drop files or a folder here"}
              hint="Click to browse, or drop a folder — photos, videos, and camera RAW (CR2, NEF, ARW, DNG, HEIC, and more)"
              accept={RAW_UPLOAD_ACCEPT}
              allowDirectory
              filterFile={isRawUploadableFile}
              onFilteredEmpty={() =>
                showToast("No supported files found. Try photos, videos, or camera RAW files.", "error")
              }
              disabled={busy}
              onFiles={(files) => void onRawUpload(files)}
            />
            {filteredRawAssets.length > 0 ? (
              <FolderUploadBulkToolbar
                selectAllRef={rawSelectAllRef}
                selectedCount={selectedRawIds.size}
                totalCount={filteredRawAssets.length}
                allSelected={rawAllSelected}
                onSelectAll={setRawSelectAll}
                onDeleteSelected={() => void onDeleteSelectedRaw()}
                onDeleteAll={() => void onDeleteAllRaw()}
                deletingKey={deletingKey}
                mediaDeleteBlocked={mediaDeleteBlocked()}
                deleteKeyPrefix="raw"
              />
            ) : null}
            {rawAssets.length === 0 ? (
              <FolderUploadEmptyState
                title="No uploads yet"
                description="Drop files here or pick a set above to organize by section."
              />
            ) : filteredRawAssets.length === 0 ? (
              <FolderUploadEmptyState
                title="No files in this set"
                description="Switch to All or another set, or upload files while this set is selected."
              />
            ) : (
              <FolderUploadMediaGrid
                items={filteredRawAssets.map((a) => ({
                  id: a.id,
                  name: a.originalName,
                  mediaSrc: demoAssetGridSrc(a),
                  isVideo: isFolderMediaVideo(a),
                  derivativesPending: a.derivativesReady === false && !isFolderMediaVideo(a),
                }))}
                selectedIds={selectedRawIds}
                onToggleSelected={toggleRawSelected}
                onOpenPreview={(id) => {
                  setLightboxId(id);
                  setLightboxZoom(1);
                }}
                onDelete={(id) => void onDeleteRawAsset(id)}
                onSetCover={(id) => void onSetCoverFromMedia(id, "raw")}
                deletingKey={deletingKey}
                settingCoverKey={settingCoverKey}
                mediaDeleteBlocked={mediaDeleteBlocked()}
                deleteKeyPrefix="raw"
                reorderable
                reorderDisabled={busy}
                onReorder={onReorderRawMedia}
              />
            )}
          </div>
        ) : null}


        {tab === "selection" ? (
          <div className="space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Client selections
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Review picks and comments — filtered by the active set above.
                </p>
              </div>
              <SelectionFilterBar
                mode={selectionFilter}
                onModeChange={setSelectionFilter}
                selectedCount={clientSelectedAssets.length}
                commentsCount={selectionWithComments.length}
              />
            </div>

            {filteredSelectionBySet.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {selectionFilter === "comments"
                    ? "No commented selections in this set."
                    : filteredSelectionAssets.length === 0
                      ? "No client selections yet. When clients pick shots from the share link, they will show up here."
                      : "No selections in this set. Try All or another set."}
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredSelectionBySet.map((a) => {
                  const mediaSrc = demoAssetGridSrc(a);
                  const isVideo = isFolderMediaVideo(a);
                  const hasComment = Boolean((a.clientComment ?? "").trim());
                  const hasReply = Boolean((a.photographerReply ?? "").trim());
                  const selectedAtLabel = formatSelectedAt(a.selectedAt);
                  const feedbackId = `sel:${a.id}`;
                  return (
                  <li
                    key={a.id}
                    className={cn(
                      "group overflow-hidden rounded-2xl border bg-white shadow-sm ring-1 ring-zinc-900/[0.03] transition hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-950 dark:ring-white/[0.04]",
                      activeFeedbackId === feedbackId
                        ? "border-brand/45 ring-2 ring-brand/20"
                        : "border-zinc-200/90 dark:border-zinc-700",
                    )}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800/80">
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-20 bg-gradient-to-t from-black/30 to-transparent" />
                      {hasComment ? (
                        <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-sky-500 px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
                          <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                          Comment
                        </span>
                      ) : null}
                      <button
                        type="button"
                        className="absolute inset-0 flex h-full w-full text-left outline-none ring-inset focus-visible:ring-2 focus-visible:ring-brand/40"
                        onClick={() => {
                          if (hasComment) focusFeedbackThread(feedbackId);
                          setLightboxId(a.id);
                          setLightboxZoom(1);
                        }}
                        aria-label={`Preview ${a.originalName}`}
                      >
                        <FolderMediaThumb src={mediaSrc} name={a.originalName} isVideo={isVideo} />
                      </button>
                    </div>
                    <div className="border-t border-zinc-100 bg-zinc-50/40 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-900/20">
                      <p className="truncate text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">
                        {a.originalName}
                      </p>
                      <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {hasComment ? "1 comment" : "No comments"}
                        {hasReply ? " · Replied" : ""} ·{" "}
                        {selectedAtLabel ? `Selected ${selectedAtLabel}` : "Selected by client"}
                      </p>
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}


        {tab === "finals" ? (
          <div className="space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
            <div className="space-y-3">
              <FolderUploadSectionHeader
                icon={Layers}
                title="Final delivery"
                description="Upload finished edits into the active set chosen above."
                count={finalAssets.length}
              />
                {finalAssets.length > 0 && lockedFinalCount > 0 ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-amber-950 dark:bg-amber-950/50 dark:text-amber-100">
                      <Lock className="h-3 w-3" aria-hidden />
                      {lockedFinalCount} locked
                    </span>
                    {flaggedFinalItems.length > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-rose-800 dark:bg-rose-950/55 dark:text-rose-200">
                        <Flag className="h-3 w-3" aria-hidden />
                        {flaggedFinalItems.length} flagged
                      </span>
                    ) : null}
                  </div>
                ) : flaggedFinalItems.length > 0 ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-rose-800 dark:bg-rose-950/55 dark:text-rose-200">
                      <Flag className="h-3 w-3" aria-hidden />
                      {flaggedFinalItems.length} flagged
                    </span>
                  </div>
                ) : null}
            </div>
            <FolderUploadOptionToggle
              checked={finalUploadWatermark}
              onChange={(checked) => void onFinalUploadWatermarkChange(checked)}
              disabled={busy || savingFinalWatermark}
              label="Add watermark for final images"
              hint="Applies your brand logo watermark to uploaded finals."
              prerequisiteMet={studioBrandWatermarkEnabled !== false}
              prerequisiteMessage="Turn on your brand watermark in Settings → Watermark first."
              onPrerequisiteNeeded={goToBrandWatermarkSettings}
            />
            <UploadDragger
              compact={finalAssets.length > 0}
              label={finalAssets.length > 0 ? "Add more finals" : "Drop finals or a folder here"}
              hint="Click to browse, or drop a folder — photos and videos"
              accept="image/jpeg,image/png,image/webp,image/gif,video/*"
              allowDirectory
              filterFile={isFinalUploadableFile}
              onFilteredEmpty={() =>
                showToast("No supported image or video files found in that folder.", "error")
              }
              disabled={busy}
              onFiles={(files) => void openFinalUploadWizard(files)}
            />
            {filteredFinalAssets.length > 0 ? (
              <FolderUploadBulkToolbar
                selectAllRef={finalSelectAllRef}
                selectedCount={selectedFinalIds.size}
                totalCount={filteredFinalAssets.length}
                allSelected={finalAllSelected}
                onSelectAll={setFinalSelectAll}
                onDeleteSelected={() => void onDeleteSelectedFinals()}
                onDeleteAll={() => void onDeleteAllFinals()}
                deletingKey={deletingKey}
                mediaDeleteBlocked={mediaDeleteBlocked()}
                deleteKeyPrefix="final"
              />
            ) : null}
            {finalAssets.length === 0 ? (
              <FolderUploadEmptyState
                title="No finals yet"
                description="Drop finals here or pick a set above to organize by section."
              />
            ) : filteredFinalAssets.length === 0 ? (
              <FolderUploadEmptyState
                title="No finals in this set"
                description="Switch to All or another set, or upload while this set is selected."
              />
            ) : (
              <FolderUploadMediaGrid
                items={filteredFinalAssets.map((f) => ({
                  id: f.id,
                  name: f.name,
                  mediaSrc: f.url,
                  isVideo: isFolderMediaVideo(f),
                  locked: f.locked,
                  outstandingBalanceGhs: f.outstandingBalanceGhs,
                  flagged: flaggedFinalIdSet.has(f.id),
                }))}
                selectedIds={selectedFinalIds}
                onToggleSelected={toggleFinalSelected}
                onOpenPreview={(id) => {
                  setLightboxId(id);
                  setLightboxZoom(1);
                }}
                onDelete={(id) => void onDeleteFinalAsset(id)}
                onSetCover={(id) => void onSetCoverFromMedia(id, "final")}
                onLockFinal={openLockFinalModal}
                onUnlockFinal={(id) => void onUnlockFinal(id)}
                lockBusyId={lockFinalBusyId}
                deletingKey={deletingKey}
                settingCoverKey={settingCoverKey}
                mediaDeleteBlocked={mediaDeleteBlocked()}
                deleteKeyPrefix="final"
                reorderable
                reorderDisabled={busy}
                onReorder={onReorderFinalMedia}
              />
            )}
          </div>
        ) : null}

        {/* {tab === "blog" ? (
          <GalleryBlogEditorPanel
            folderId={folder._id}
            uploads={extractRawMediaList(folder)}
            busy={busy}
          />
        ) : null} */}
        </div>

        {tab === "gallery" ? (
          <CustomizeGallerySidebar
            coverFrameDraft={coverFrameDraft}
            onCoverFrameChange={setCoverFrameDraft}
            coverColorDraft={coverColorDraft}
            onCoverColorChange={setCoverColorDraft}
            coverTextColorDraft={coverTextColorDraft}
            onCoverTextColorChange={setCoverTextColorDraft}
            coverButtonColorDraft={coverButtonColorDraft}
            onCoverButtonColorChange={setCoverButtonColorDraft}
            savingCoverFrame={savingCoverFrame}
            previewLayout={imageLayoutDraft}
            onPreviewLayoutChange={setImageLayoutDraft}
            savingImageLayout={savingImageLayout}
            titleFont={titleFontDraft}
            bodyFont={bodyFontDraft}
            onTitleFontChange={setTitleFontDraft}
            onBodyFontChange={setBodyFontDraft}
            coverFrameOptions={coverFrameOptions}
            gridLayoutOptions={gridLayoutOptions}
            coverColorPresets={coverColorPresets}
            titleFontOptions={titleFontOptions}
            bodyFontOptions={bodyFontOptions}
            allowDownloads={allowDownloadsDraft}
            onAllowDownloadsChange={onAllowDownloadsChange}
            musicEnabled={folder.backgroundMusicEnabled !== false}
            onMusicEnabledChange={(v) => void onToggleBackgroundMusicForClients(v)}
            musicBusy={musicBusy}
            hasMusic={Boolean(folder.backgroundMusicUrl)}
            passwordProtection={passwordProtectionDraft}
            onPasswordProtectionChange={onPasswordProtectionChange}
            galleryAccessPin={galleryAccessPinDraft}
            accessPinCopied={accessPinCopied}
            onCopyAccessPin={() => void onCopyAccessPin()}
            onRegenerateAccessPin={onRegenerateAccessPin}
            accessPinBusy={accessPinBusy}
            emailGateEnabled={emailGateDraft}
            onEmailGateChange={onEmailGateChange}
            galleryAccessEmails={galleryAccessEmails}
            emailGateBusy={emailGateBusy}
            coverBusy={coverBusy}
            hasCover={hasCover}
            onReplaceCover={() => coverFileInputRef.current?.click()}
            onAdjustFocal={() => (focalEditOpen ? cancelFocalEditor() : openFocalEditor())}
            focalEditOpen={focalEditOpen}
            coverSrc={coverSrc}
            focalX={focalDraft.x}
            focalY={focalDraft.y}
            onFocalChange={(x, y) => setFocalDraft({ x, y })}
            savingFocal={savingFocal}
            onSaveFocal={() => void saveCoverFocal()}
            onCancelFocal={cancelFocalEditor}
            onUploadMusic={() => musicFileInputRef.current?.click()}
            onRemoveMusic={() => void onRemoveBackgroundMusic()}
          />
        ) : null}

        {tab === "uploads" ? uploadsSidebar : null}

        {tab === "selection" || tab === "finals" ? feedbackSidebar : null}
      </div>

      {lockFinalModal ? (
        <LockFinalModal
          state={lockFinalModal}
          busy={lockFinalBusyId !== null}
          onClose={() => setLockFinalModal(null)}
          onAmountChange={(amount) =>
            setLockFinalModal((current) => (current ? { ...current, amount } : current))
          }
          onConfirm={() => void onConfirmLockFinal()}
        />
      ) : null}

      {finalWizardOpen ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="final-wizard-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-950">
            <h2
              id="final-wizard-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Final delivery
            </h2>
            {finalWizardStep === "choose" ? (
              <>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Has the client paid for these finals?
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                  <button
                    type="button"
                    className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
                    onClick={() => setFinalWizardOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
                    onClick={() => setFinalWizardStep("unpaid")}
                  >
                    Not yet
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover"
                    onClick={() => {
                      setFinalWizardOpen(false);
                      void executeFinalUploadPipeline(finalWizardFiles, {
                        clientHasPaidForFinals: true,
                      });
                    }}
                  >
                    Yes — upload
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Enter what they still owe. Lock previews until paid.
                </p>
                <label className="mt-4 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Amount remaining
                  <FormInput
                    inputMode="decimal"
                    value={finalWizardBalance}
                    onChange={(e) => setFinalWizardBalance(e.target.value)}
                    placeholder="e.g. 500"
                    className="mt-1"
                  />
                </label>
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={finalWizardLock}
                    onChange={(e) => setFinalWizardLock(e.target.checked)}
                    className="rounded border-zinc-300 text-brand focus:ring-brand dark:border-zinc-600"
                  />
                  Lock finals before upload
                </label>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
                    onClick={() => setFinalWizardStep("choose")}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover"
                    onClick={() => {
                      const raw = finalWizardBalance.trim().replace(/,/g, "");
                      if (!raw || Number.isNaN(Number(raw))) {
                        showToast("Enter a valid outstanding amount.", "error");
                        return;
                      }
                      setFinalWizardOpen(false);
                      void executeFinalUploadPipeline(finalWizardFiles, {
                        clientHasPaidForFinals: false,
                        amountRemainingGHS: raw,
                        lockImagesBeforeUpload: finalWizardLock,
                      });
                    }}
                  >
                    Upload
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {lightboxId && lbItem ? (
        <MediaLightbox
          open
          onClose={() => {
            setLightboxId(null);
            setLightboxZoom(1);
          }}
          ariaLabel="Media preview"
          zIndexClass="z-[115]"
          mediaKey={lbItem.id}
          title={lbItem.name}
          counter={
            lightboxNavItems.length > 1
              ? { current: lbNavIndex + 1, total: lightboxNavItems.length }
              : undefined
          }
          canPrevious={lbNavIndex > 0}
          canNext={lbNavIndex >= 0 && lbNavIndex < lightboxNavItems.length - 1}
          onPrevious={() => {
            const prev = lightboxNavItems[lbNavIndex - 1];
            if (prev) {
              setLightboxId(prev.id);
              setLightboxZoom(1);
            }
          }}
          onNext={() => {
            const next = lightboxNavItems[lbNavIndex + 1];
            if (next) {
              setLightboxId(next.id);
              setLightboxZoom(1);
            }
          }}
          zoomEnabled={!lbItem.isVideo}
          zoom={lightboxZoom}
          onZoomChange={setLightboxZoom}
        >
          {lbItem.isVideo ? (
            <video
              src={lbItem.src}
              controls
              playsInline
              preload="metadata"
              aria-label={lbItem.name}
              className={cn(lightboxMediaClass, "bg-black")}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lbItem.src}
              alt={lbItem.name}
              className={lightboxMediaClass}
              draggable={false}
            />
          )}
        </MediaLightbox>
      ) : null}

      {folder ? (
        <CreateFolderModal
          open={editOpen}
          folder={folder}
          onClose={() => setEditOpen(false)}
          onSaved={(saved) => {
            setFolder(saved);
            setEditOpen(false);
          }}
        />
      ) : null}

      {duplicateFilenamePrompt ? (
        <DuplicateUploadConflictDialog
          prompt={{
            kind: duplicateFilenamePrompt.kind,
            files: duplicateFilenamePrompt.files,
            conflictingNames: duplicateFilenamePrompt.conflictingNames,
          }}
          onCancel={onDuplicatePromptCancel}
          onSkip={() => void onDuplicatePromptSkip()}
          onReplace={() => void onDuplicatePromptReplace()}
        />
      ) : null}
    </div>
  );
}
