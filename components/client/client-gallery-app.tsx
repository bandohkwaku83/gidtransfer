"use client";

/**
 * Public client gallery (`/g/...`, `/[companySlug]/[gallerySlug]`).
 * Self-contained marketing-style UI: cover, layout modes, selection hearts, zoom lightbox.
 * Do not conflate with photographer `folder-detail-view` dashboard grids.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  CalendarDays,
  ChevronDown,
  Copy,
  Download,
  Flag,
  Heart,
  Loader2,
  Lock,
  Send,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  clientInitials,
  editedCardClass,
  finalDisplaySrc,
  GALLERY_MUSIC_MUTE_PREFIX,
  GRID_LAYOUTS,
  GRID_STORAGE_PREFIX,
  galleryListClass,
  galleryTileHoverActionsClass,
  galleryTileHoverIconClass,
  isClientAssetVideo,
  isCollageGridLayout,
  isShareFinalVideo,
  normalizeGalleryImageLayout,
  SELECTED_STRIP_IMAGE_SIZES,
  SHARE_GRID_IMAGE_QUALITY,
  SHARE_LIGHTBOX_IMAGE_QUALITY,
  SHARE_LIGHTBOX_SIZES,
  shareGalleryGridSizes,
  toDemoAssets,
  uploadImageWrapClass,
  uploadItemClass,
  type GridLayout,
} from "@/components/client/share-gallery-bits";
import { useToast } from "@/components/toast-provider";
import { FormTextArea } from "@/components/ui/form-input";
import { ClientGalleryPageSkeleton, InlineStatusSkeleton } from "@/components/ui/skeletons";
import type { DemoAsset, SelectionState } from "@/lib/demo-data";
import { folderCoverObjectPositionStyle, type ApiFolder } from "@/lib/folders-api";
import {
  fetchShareFinalDownloadBlob,
  tryNavigatorShareFinalPhoto,
  getShareFinalDownloadUrl,
  getShareGallery,
  downloadShareFinalsZip,
  patchShareGalleryFinalComment,
  postShareGalleryFinalFlag,
  type NormalizedShareGallery,
  ShareGalleryError,
  submitShareGallerySelectionsToPhotographer,
  syncShareGallerySelections,
  type PublicGalleryKey,
  type ShareGalleryFinal,
  publicGallerySessionId,
} from "@/lib/share-gallery-api";
import { usePreferInlineFinalSave } from "@/lib/use-prefer-inline-final-save";
import { useShareSaveHints } from "@/lib/use-share-save-hints";
import { cn } from "@/lib/utils";
import { GalleryAccessGate } from "@/components/client/gallery-access-gate";
import { GalleryCoverHero } from "@/components/client/gallery-cover-hero";
import { MediaLightbox, lightboxMediaClass } from "@/components/ui/media-lightbox";
import {
  clearGalleryAccessUnlock,
  isGalleryAccessUnlocked,
  markGalleryAccessUnlocked,
} from "@/lib/gallery-access-client-config";
import { mergeGalleryAccessSettings } from "@/lib/gallery-access-merge";

export function ClientGalleryApp({ publicKey }: { publicKey: PublicGalleryKey }) {
  const sessionId = publicGallerySessionId(publicKey);
  const { showToast } = useToast();
  const [gallery, setGallery] = useState<NormalizedShareGallery | null>(null);
  const [assets, setAssets] = useState<DemoAsset[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ok">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [finalLightboxId, setFinalLightboxId] = useState<string | null>(null);
  const [coverLightboxOpen, setCoverLightboxOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [photoTab, setPhotoTab] = useState<"all" | "selected" | "edited">("all");
  const [zoom, setZoom] = useState(1);
  const [gridLayout, setGridLayout] = useState<GridLayout>("masonry");
  const [downloadAllFinalsBusy, setDownloadAllFinalsBusy] = useState(false);
  const [finalSaveBusyId, setFinalSaveBusyId] = useState<string | null>(null);
  const [finalFeedback, setFinalFeedback] = useState<{
    finalId: string;
    finalName: string;
    comment: string;
    flaggedByClient: boolean;
    photographerReply?: string;
  } | null>(null);
  const [finalFeedbackBusy, setFinalFeedbackBusy] = useState(false);
  const [photoSaveAssist, setPhotoSaveAssist] = useState<{
    objectUrl: string;
    label: string;
    suggestOpenExternally: boolean;
  } | null>(null);
  const [accessUnlocked, setAccessUnlocked] = useState(false);

  const preferInlineFinalSave = usePreferInlineFinalSave();
  const shareHints = useShareSaveHints();
  /** Single-flight guard for Save on touch devices (share sheet + in-page saver). */
  const finalDeliverLock = useRef(false);
  const photoSaveBlobUrlRef = useRef<string | null>(null);
  /** Applied once after share data loads so the first tab matches finals vs originals. */
  const initialPhotoTabAppliedRef = useRef(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [galleryMusicStarted, setGalleryMusicStarted] = useState(false);
  const [galleryMusicMuted, setGalleryMusicMuted] = useState(false);

  useEffect(() => {
    initialPhotoTabAppliedRef.current = false;
    setAccessUnlocked(false);
    clearGalleryAccessUnlock(sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (loadState === "ok") {
      setAccessUnlocked(isGalleryAccessUnlocked(sessionId));
    }
  }, [loadState, sessionId]);

  useEffect(() => {
    try {
      const v3Key = `${GRID_STORAGE_PREFIX}${sessionId}`;
      let raw = sessionStorage.getItem(v3Key);
      if (!raw) {
        raw = sessionStorage.getItem(`gidostorage-share-grid:v2:${sessionId}`);
      }
      if (raw) setGridLayout(normalizeGalleryImageLayout(raw));
    } catch {
      /* ignore */
    }
  }, [sessionId]);

  useEffect(() => {
    try {
      sessionStorage.setItem(`${GRID_STORAGE_PREFIX}${sessionId}`, gridLayout);
    } catch {
      /* ignore */
    }
  }, [sessionId, gridLayout]);

  const galleryMusicUrl = gallery?.backgroundMusicUrl?.trim() ?? "";
  const musicAllowed =
    galleryMusicUrl.length > 0 && gallery != null && gallery.backgroundMusicEnabled !== false;

  const playGalleryMusic = useCallback(
    (options?: { ignoreMuted?: boolean; showError?: boolean }) => {
      if (!musicAllowed || (!options?.ignoreMuted && galleryMusicMuted)) return;
      const audio = audioRef.current;
      if (!audio) return;
      void audio.play().then(() => {
        setGalleryMusicStarted(true);
      }).catch(() => {
        if (options?.showError) {
          showToast("Could not start gallery music. Try again.", "error");
        }
      });
    },
    [galleryMusicMuted, musicAllowed, showToast],
  );

  useEffect(() => {
    setGalleryMusicStarted(false);
    setGalleryMusicMuted(false);
    try {
      sessionStorage.removeItem(`${GALLERY_MUSIC_MUTE_PREFIX}${sessionId}`);
    } catch {
      setGalleryMusicMuted(false);
    }
  }, [galleryMusicUrl, sessionId]);

  useEffect(() => {
    if (!musicAllowed) setGalleryMusicStarted(false);
  }, [musicAllowed]);

  /** Try autoplay with sound; browsers often block until a gesture (handled below). */
  useEffect(() => {
    if (!musicAllowed || galleryMusicMuted) return;
    let cancelled = false;
    const audio = audioRef.current;
    if (!audio) return;
    void audio.play().then(() => {
      if (!cancelled) setGalleryMusicStarted(true);
    }).catch(() => {
      /* Autoplay blocked — first pointer gesture effect will retry. */
    });
    return () => {
      cancelled = true;
    };
  }, [galleryMusicMuted, galleryMusicUrl, musicAllowed]);

  /** First tap, key, wheel, touch, or scroll starts music when autoplay was blocked. */
  useEffect(() => {
    if (!musicAllowed || galleryMusicMuted || galleryMusicStarted) return;
    const tryStart = () => {
      playGalleryMusic();
    };
    const opts = { capture: true, passive: true } as const;
    window.addEventListener("pointerdown", tryStart, opts);
    window.addEventListener("keydown", tryStart, opts);
    window.addEventListener("wheel", tryStart, opts);
    window.addEventListener("touchstart", tryStart, opts);
    window.addEventListener("scroll", tryStart, opts);
    return () => {
      window.removeEventListener("pointerdown", tryStart, opts);
      window.removeEventListener("keydown", tryStart, opts);
      window.removeEventListener("wheel", tryStart, opts);
      window.removeEventListener("touchstart", tryStart, opts);
      window.removeEventListener("scroll", tryStart, opts);
    };
  }, [galleryMusicMuted, galleryMusicStarted, galleryMusicUrl, musicAllowed, playGalleryMusic]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !musicAllowed) return;
    if (!galleryMusicStarted) return;
    if (galleryMusicMuted) {
      a.pause();
    } else {
      void a.play().catch(() => {});
    }
  }, [musicAllowed, galleryMusicStarted, galleryMusicMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, [musicAllowed, galleryMusicUrl]);

  useEffect(() => {
    if (!musicAllowed) return;
    const cleanupAudio = audioRef.current;
    const stopMusic = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
      setGalleryMusicStarted(false);
    };
    const stopWhenHidden = () => {
      if (document.hidden) stopMusic();
    };
    window.addEventListener("pagehide", stopMusic);
    window.addEventListener("beforeunload", stopMusic);
    document.addEventListener("visibilitychange", stopWhenHidden);
    return () => {
      window.removeEventListener("pagehide", stopMusic);
      window.removeEventListener("beforeunload", stopMusic);
      document.removeEventListener("visibilitychange", stopWhenHidden);
      if (cleanupAudio) {
        cleanupAudio.pause();
        cleanupAudio.currentTime = 0;
      }
    };
  }, [galleryMusicUrl, musicAllowed]);

  const toggleGalleryMusic = useCallback(() => {
    if (!musicAllowed) return;
    const audio = audioRef.current;
    const shouldMute = galleryMusicStarted && !galleryMusicMuted;

    try {
      if (shouldMute) {
        setGalleryMusicMuted(true);
        audio?.pause();
        sessionStorage.setItem(`${GALLERY_MUSIC_MUTE_PREFIX}${sessionId}`, "1");
        return;
      }

      setGalleryMusicMuted(false);
      sessionStorage.removeItem(`${GALLERY_MUSIC_MUTE_PREFIX}${sessionId}`);
      playGalleryMusic({ ignoreMuted: true, showError: true });
    } catch {
      showToast("Could not update gallery music.", "error");
    }
  }, [galleryMusicMuted, galleryMusicStarted, musicAllowed, playGalleryMusic, sessionId, showToast]);

  useEffect(() => {
    if (gallery?.finalDelivery === false && photoTab === "edited") {
      setPhotoTab("all");
    }
  }, [gallery?.finalDelivery, photoTab]);

  /**
   * First open: land on Finals when there are delivered finals; otherwise Originals.
   * Optional URL override: `?tab=edited|all|selected` or `?view=finals|raw|originals|all|selected|edited`.
   */
  useEffect(() => {
    if (loadState !== "ok" || !gallery) return;
    if (initialPhotoTabAppliedRef.current) return;
    initialPhotoTabAppliedRef.current = true;

    let tabParam = "";
    let viewParam = "";
    if (typeof window !== "undefined") {
      try {
        const sp = new URLSearchParams(window.location.search);
        tabParam = sp.get("tab")?.toLowerCase() ?? "";
        viewParam = sp.get("view")?.toLowerCase() ?? "";
      } catch {
        /* ignore */
      }
    }

    const showFinals = gallery.finalDelivery !== false;

    if (tabParam === "selected" || viewParam === "selected") {
      setPhotoTab("selected");
      return;
    }
    if (
      showFinals &&
      (tabParam === "edited" ||
        tabParam === "finals" ||
        viewParam === "finals" ||
        viewParam === "edited")
    ) {
      setPhotoTab("edited");
      return;
    }
    if (
      tabParam === "all" ||
      tabParam === "originals" ||
      tabParam === "raw" ||
      viewParam === "raw" ||
      viewParam === "originals" ||
      viewParam === "all"
    ) {
      setPhotoTab("all");
      return;
    }

    if (showFinals && gallery.finals.length > 0) {
      setPhotoTab("edited");
    } else {
      setPhotoTab("all");
    }
  }, [gallery, loadState]);

  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");
    setLoadError(null);
    setGallery(null);
    setAssets([]);

    getShareGallery(publicKey)
      .then((g) => {
        if (cancelled) return;
        const merged = mergeGalleryAccessSettings(g, sessionId);
        setGallery(merged);
        setAssets(toDemoAssets(merged.assets));
        setLoadState("ok");
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err instanceof ShareGalleryError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Could not load gallery.";
        setLoadError(msg);
        setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  const editingLocked = useMemo(() => {
    if (!gallery) return true;
    return !gallery.canEditSelections || gallery.selectionLocked;
  }, [gallery]);

  const showFinalsTab = gallery ? gallery.finalDelivery !== false : true;

  const selectedCount = assets.filter((a) => a.selection === "SELECTED").length;
  const selectionLimit = gallery?.selectionLimit ?? null;
  const selectedCountLabel = selectionLimit ? `${selectedCount}/${selectionLimit}` : `${selectedCount}`;
  const editedCount = gallery?.finals.length ?? 0;
  const uploadsCount = gallery?.counts?.uploads ?? assets.length;

  const selectedAssets = useMemo(
    () => assets.filter((a) => a.selection === "SELECTED"),
    [assets],
  );

  const visibleAssets = useMemo(() => {
    if (photoTab === "selected") return assets.filter((a) => a.selection === "SELECTED");
    if (photoTab === "edited") return [];
    return assets;
  }, [assets, photoTab]);

  const downloadableFinals = useMemo(
    () => (gallery ? gallery.finals.filter((f) => !f.locked) : []),
    [gallery],
  );

  /** One place for coarse-pointer final Save / Share wording (Share sheet vs in‑app browsers). */
  const touchMobileFinalSaveUx = useMemo(() => {
    if (!preferInlineFinalSave) return null;

    let explainer:
      | { variant: "in_app"; heading: string; body: string }
      | { variant: "one_line"; text: string }
      | null = null;

    if (shareHints.inAppSocialWebView) {
      explainer = {
        variant: "in_app",
        heading: "For Save to Photos, use Safari or Chrome",
        body: "Browsers opened from chat apps usually block downloads. Use Open in Safari (or Browser / Chrome) in the ⋯ or share menu above, open this gallery there, then tap Save / Share. You can copy the link below anytime.",
      };
    } else if (shareHints.likelyWebShareImage) {
      explainer = null;
    } else {
      explainer = {
        variant: "one_line",
        text: "Tap Save / Share. We’ll use Share when your browser supports it, or open a preview you can touch and hold to Save Image.",
      };
    }

    const saveButtonTitle = shareHints.inAppSocialWebView
      ? "Prefer opening this gallery in Safari or Chrome. This opens Share when available, otherwise a saver you can touch and hold."
      : shareHints.likelyWebShareImage
        ? "Opens the Share sheet so you choose Photos, Files, or another destination when your browser supports it."
        : "Opens Share where supported, otherwise a preview you touch and hold to save.";

    return { explainer, saveButtonTitle };
  }, [preferInlineFinalSave, shareHints.inAppSocialWebView, shareHints.likelyWebShareImage]);

  /** Photos to navigate in the lightbox (matches current tab’s upload list). */
  const lightboxNavAssets = visibleAssets;

  useEffect(() => {
    if (
      lightboxId &&
      !lightboxNavAssets.some((a) => a.id === lightboxId)
    ) {
      setLightboxId(null);
    }
  }, [lightboxId, lightboxNavAssets]);

  const openLb = useCallback((id: string) => {
    setFinalLightboxId(null);
    setCoverLightboxOpen(false);
    setLightboxId(id);
    setZoom(1);
  }, []);

  const openFinalLb = useCallback((id: string) => {
    setLightboxId(null);
    setCoverLightboxOpen(false);
    setFinalLightboxId(id);
    setZoom(1);
  }, []);

  const openCoverLb = useCallback(() => {
    setLightboxId(null);
    setFinalLightboxId(null);
    setCoverLightboxOpen(true);
    setZoom(1);
  }, []);

  const closeAllPreviews = useCallback(() => {
    setLightboxId(null);
    setFinalLightboxId(null);
    setCoverLightboxOpen(false);
    setZoom(1);
  }, []);

  const closePhotoSaveAssist = useCallback(() => {
    const url = photoSaveBlobUrlRef.current;
    photoSaveBlobUrlRef.current = null;
    if (url) URL.revokeObjectURL(url);
    setPhotoSaveAssist(null);
  }, []);

  const copyGalleryPageUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Gallery link copied. Paste it into Safari or Chrome, then tap Save / Share again.", "success");
    } catch {
      showToast("Could not copy automatically. Copy the website address manually and open it in Safari or Chrome.", "error");
    }
  }, [showToast]);

  const handleDeliverFinalPhotoMobile = useCallback(
    async (f: ShareGalleryFinal) => {
      if (downloadAllFinalsBusy || finalDeliverLock.current) return;
      finalDeliverLock.current = true;
      const id = f.id;
      setFinalSaveBusyId(id);
      try {
        const blob = await fetchShareFinalDownloadBlob(publicKey, f);
        const viaShare = await tryNavigatorShareFinalPhoto(blob, f.name || `final-${f.id}`);
        if (viaShare) return;

        const url = URL.createObjectURL(blob);
        if (photoSaveBlobUrlRef.current) URL.revokeObjectURL(photoSaveBlobUrlRef.current);
        photoSaveBlobUrlRef.current = url;
        setPhotoSaveAssist({
          objectUrl: url,
          label: (f.name || "Photo").replace(/[^\w\s.-]/g, "").trim() || "Photo",
          suggestOpenExternally: shareHints.inAppSocialWebView,
        });
      } catch (e) {
        const msg =
          e instanceof ShareGalleryError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not load this photo.";
        showToast(msg, "error");
      } finally {
        finalDeliverLock.current = false;
        setFinalSaveBusyId((cur) => (cur === id ? null : cur));
      }
    },
    [publicKey, showToast, downloadAllFinalsBusy, shareHints.inAppSocialWebView],
  );

  useEffect(() => {
    return () => {
      const orphan = photoSaveBlobUrlRef.current;
      photoSaveBlobUrlRef.current = null;
      if (orphan) URL.revokeObjectURL(orphan);
    };
  }, []);

  useEffect(() => {
    if (!photoSaveAssist) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePhotoSaveAssist();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photoSaveAssist, closePhotoSaveAssist]);

  async function refetchGallery() {
    const g = await getShareGallery(publicKey);
    setGallery(g);
    setAssets(toDemoAssets(g.assets));
    return g;
  }

  async function handleDownloadAllFinals() {
    if (!gallery || downloadableFinals.length === 0 || downloadAllFinalsBusy) return;
    setDownloadAllFinalsBusy(true);
    try {
      await downloadShareFinalsZip(
        publicKey,
        downloadableFinals.map((f) => ({ id: f.id, name: f.name })),
      );
      showToast("Download started.", "success");
    } catch (e) {
      showToast(
        e instanceof ShareGalleryError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not download all files.",
        "error",
      );
    } finally {
      setDownloadAllFinalsBusy(false);
    }
  }

  function openFinalFeedback(f: ShareGalleryFinal) {
    if (f.locked) return;
    const comment = f.clientComment?.trim() ?? "";
    setFinalFeedback({
      finalId: f.id,
      finalName: f.name,
      comment,
      flaggedByClient: Boolean(f.flaggedByClient),
      photographerReply: f.photographerReply?.trim() || undefined,
    });
  }

  async function submitFinalFeedback() {
    if (!finalFeedback || finalFeedbackBusy) return;
    const comment = finalFeedback.comment.trim();
    if (!comment) {
      showToast("Add a note for your photographer before flagging this final.", "error");
      return;
    }
    setFinalFeedbackBusy(true);
    try {
      if (finalFeedback.flaggedByClient) {
        await patchShareGalleryFinalComment(publicKey, finalFeedback.finalId, comment);
      } else {
        await postShareGalleryFinalFlag(publicKey, finalFeedback.finalId, comment);
      }
      setGallery((current) =>
        current
          ? {
              ...current,
              finals: current.finals.map((f) =>
                f.id === finalFeedback.finalId
                  ? { ...f, clientComment: comment, flaggedByClient: true }
                  : f,
              ),
            }
          : current,
      );
      showToast(
        finalFeedback.flaggedByClient ? "Feedback updated." : "Final flagged for review.",
        "success",
      );
      setFinalFeedback(null);
    } catch (e) {
      showToast(
        e instanceof ShareGalleryError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not send feedback.",
        "error",
      );
    } finally {
      setFinalFeedbackBusy(false);
    }
  }

  async function toggleSelect(id: string) {
    if (editingLocked || syncBusy) return;
    const nextAssets: DemoAsset[] = assets.map((a) =>
      a.id === id
        ? {
            ...a,
            selection:
              (a.selection === "SELECTED" ? "UNSELECTED" : "SELECTED") as SelectionState,
          }
        : a,
    );
    const selectedIds = nextAssets.filter((a) => a.selection === "SELECTED").map((a) => a.id);
    setAssets(nextAssets);
    setSyncBusy(true);
    try {
      await syncShareGallerySelections(publicKey, selectedIds);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not update selection.", "error");
      try {
        await refetchGallery();
      } catch {
        /* ignore */
      }
    } finally {
      setSyncBusy(false);
    }
  }

  async function submitSelections() {
    const isUpdate = Boolean(gallery?.selectionSubmitted);
    setSyncBusy(true);
    try {
      await submitShareGallerySelectionsToPhotographer(publicKey);
      await refetchGallery();
      setConfirmOpen(false);
      showToast(
        isUpdate ? "Updated selection sent to your photographer." : "Selections submitted.",
        "success",
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not submit.", "error");
    } finally {
      setSyncBusy(false);
    }
  }

  const lbAsset =
    lightboxId ? assets.find((a) => a.id === lightboxId) ?? null : null;
  const lbAssetIsVideo = lbAsset ? isClientAssetVideo(lbAsset) : false;
  const lbNavIndex = lbAsset
    ? lightboxNavAssets.findIndex((a) => a.id === lbAsset.id)
    : -1;

  const finalLb =
    gallery && finalLightboxId
      ? gallery.finals.find((f) => f.id === finalLightboxId) ?? null
      : null;
  const finalLbIndex =
    finalLb && gallery ? gallery.finals.findIndex((f) => f.id === finalLb.id) : -1;

  useEffect(() => {
    if (photoTab !== "edited") setFinalLightboxId(null);
  }, [photoTab]);

  useEffect(() => {
    if (
      finalLightboxId &&
      gallery &&
      !gallery.finals.some((f) => f.id === finalLightboxId)
    ) {
      setFinalLightboxId(null);
    }
  }, [finalLightboxId, gallery]);

  useEffect(() => {
    if (!lightboxId && !finalLightboxId && !coverLightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeAllPreviews();
        return;
      }
      const target = e.target as HTMLElement | null;
      if (
        target?.closest("input, textarea, select") ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        if (coverLightboxOpen) return;

        if (finalLightboxId && gallery && gallery.finals.length > 0) {
          if (e.key === "ArrowLeft" && finalLbIndex > 0) {
            e.preventDefault();
            const prev = gallery.finals[finalLbIndex - 1];
            if (prev) {
              setFinalLightboxId(prev.id);
              setZoom(1);
            }
          } else if (
            e.key === "ArrowRight" &&
            finalLbIndex >= 0 &&
            finalLbIndex < gallery.finals.length - 1
          ) {
            e.preventDefault();
            const next = gallery.finals[finalLbIndex + 1];
            if (next) {
              setFinalLightboxId(next.id);
              setZoom(1);
            }
          }
          return;
        }

        if (lightboxId && lbAsset && lightboxNavAssets.length > 0) {
          if (e.key === "ArrowLeft" && lbNavIndex > 0) {
            e.preventDefault();
            const prev = lightboxNavAssets[lbNavIndex - 1];
            if (prev) {
              setLightboxId(prev.id);
              setZoom(1);
            }
          } else if (
            e.key === "ArrowRight" &&
            lbNavIndex >= 0 &&
            lbNavIndex < lightboxNavAssets.length - 1
          ) {
            e.preventDefault();
            const next = lightboxNavAssets[lbNavIndex + 1];
            if (next) {
              setLightboxId(next.id);
              setZoom(1);
            }
          }
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    lightboxId,
    finalLightboxId,
    coverLightboxOpen,
    closeAllPreviews,
    gallery,
    finalLbIndex,
    lbAsset,
    lbNavIndex,
    lightboxNavAssets,
  ]);

  const displayTitle = gallery?.eventName?.trim() || "Select your favorites";

  const heroBrandLabel = useMemo(() => {
    const name = gallery?.studio?.companyName?.trim();
    return name ? name.toUpperCase() : "";
  }, [gallery?.studio?.companyName]);

  const eventDateLabel = useMemo(() => {
    if (!gallery?.eventDate) return null;
    const d = new Date(gallery.eventDate);
    return Number.isNaN(d.getTime())
      ? gallery.eventDate
      : d.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  }, [gallery?.eventDate]);
  const galleryFrameClass = "mx-auto max-w-[1680px] px-1.5 sm:px-2 lg:px-3";

  if (loadState === "loading") {
    return (
      <>
        <span className="sr-only">Loading gallery…</span>
        <ClientGalleryPageSkeleton />
      </>
    );
  }

  const accessPin = gallery?.shareAccessPin?.replace(/\D/g, "").padStart(4, "0").slice(-4);
  const needsAccessGate =
    loadState === "ok" &&
    gallery != null &&
    gallery.sharePasswordEnabled === true &&
    Boolean(accessPin) &&
    !accessUnlocked;

  if (needsAccessGate && gallery) {
    const studioLabel =
      gallery.studio?.companyName?.trim() || gallery.clientName?.trim() || "your photographer";
    return (
      <GalleryAccessGate
        studioName={studioLabel}
        galleryTitle={gallery.eventName?.trim() || undefined}
        onUnlock={(entered) => {
          if (entered !== accessPin) return false;
          markGalleryAccessUnlocked(sessionId);
          setAccessUnlocked(true);
          return true;
        }}
      />
    );
  }

  if (loadState === "error" || !gallery) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-16 text-center dark:bg-black">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {loadError ?? "Gallery could not be loaded."}
        </p>
        <button
          type="button"
          onClick={() => {
            setLoadState("loading");
            setLoadError(null);
            getShareGallery(publicKey)
              .then((g) => {
                const merged = mergeGalleryAccessSettings(g, sessionId);
                setGallery(merged);
                setAssets(toDemoAssets(merged.assets));
                setLoadState("ok");
              })
              .catch((err) => {
                const msg =
                  err instanceof ShareGalleryError
                    ? err.message
                    : err instanceof Error
                      ? err.message
                      : "Could not load gallery.";
                setLoadError(msg);
                setLoadState("error");
              });
          }}
          className="mt-4 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  const coverFrame = gallery.coverFrame;
  const coverImageObjectPosition = folderCoverObjectPositionStyle({
    _id: gallery.folderId ?? "",
    client: "",
    eventDate: "",
    description: "",
    coverFocalX: gallery.coverFocalX,
    coverFocalY: gallery.coverFocalY,
  } as ApiFolder);

  return (
    <div
      className={cn(
        "min-h-screen overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
        gallery?.rightsProtection &&
          "select-none [-webkit-touch-callout:none] [user-select:none]",
      )}
    >
      <header className="relative">
        {gallery.coverImageUrl ? (
          <GalleryCoverHero
            coverImageUrl={gallery.coverImageUrl}
            coverFrame={coverFrame}
            coverColor={gallery.coverColor}
            objectPosition={coverImageObjectPosition}
            displayTitle={displayTitle}
            heroBrandLabel={heroBrandLabel}
            selectionLocked={gallery.selectionLocked}
            onCoverClick={() => openCoverLb()}
          />
        ) : (
          <div className="relative overflow-hidden border-b border-zinc-200/90 bg-gradient-to-br from-indigo-50 via-white to-zinc-50 dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-950 dark:to-black">
            <div className="pointer-events-none absolute inset-0 opacity-[0.55] dark:opacity-40" aria-hidden>
              <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-brand/25 blur-3xl dark:bg-brand/30" />
              <div className="absolute -right-20 top-8 h-56 w-56 rounded-full bg-violet-400/25 blur-3xl dark:bg-violet-600/20" />
              <div className="absolute bottom-0 left-1/3 h-40 w-96 -translate-x-1/2 rounded-full bg-fuchsia-200/30 blur-3xl dark:bg-fuchsia-900/20" />
            </div>

            <div className={cn(galleryFrameClass, "relative flex flex-col gap-3 pb-2 pt-3 sm:flex-row sm:items-center sm:justify-between sm:pb-2")}>
              <div className="flex items-center gap-3">
                <Image
                  src="/images/gido_logo.png"
                  alt="Gido logo"
                  width={140}
                  height={44}
                  className="h-8 w-auto object-contain drop-shadow-sm sm:h-9"
                  priority
                />
              </div>
              {!editingLocked && photoTab !== "edited" ? (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                  <span className="inline-flex items-center justify-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-semibold text-zinc-800 shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100">
                    <Heart className="h-3.5 w-3.5 shrink-0 text-rose-500" aria-hidden />
                    <span className="tabular-nums">{selectedCountLabel}</span>
                    <span className="text-zinc-500 dark:text-zinc-400">selected</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {syncBusy ? <InlineStatusSkeleton size={20} /> : null}
                    <button
                      type="button"
                      disabled={selectedCount === 0 || syncBusy}
                      onClick={() => setConfirmOpen(true)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-hover disabled:opacity-40 sm:w-auto dark:hover:bg-brand-hover"
                    >
                      <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {gallery.selectionSubmitted ? "Submit again" : "Submit Selection"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className={cn(galleryFrameClass, "relative pb-2")}>
              <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
                {displayTitle}
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-snug text-zinc-600 sm:text-sm dark:text-zinc-400">
                <strong className="font-semibold text-zinc-800 dark:text-zinc-200">Originals</strong> are from your
                shoot; <strong className="font-semibold text-zinc-800 dark:text-zinc-200">Finals</strong> are edited
                files your photographer delivers. Tabs below switch between them.
              </p>
            </div>

            <div className={cn(galleryFrameClass, "relative pb-6 pt-3 lg:pb-8")}>
              <div className="rounded-2xl border border-zinc-200/90 bg-white/95 p-4 shadow-lg shadow-zinc-900/[0.04] ring-1 ring-zinc-900/[0.02] dark:border-zinc-700/90 dark:bg-zinc-900/95 dark:ring-white/[0.03] sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-indigo-700 text-xs font-bold text-white shadow-md dark:to-violet-900 sm:h-10 sm:w-10 sm:text-sm"
                      aria-hidden
                    >
                      {clientInitials(gallery.clientName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Prepared for
                      </p>
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                        {gallery.clientName}
                      </p>
                    </div>
                  </div>

                  {eventDateLabel ? (
                    <>
                      <div className="hidden h-7 w-px shrink-0 bg-zinc-200 dark:bg-zinc-600 sm:block" aria-hidden />
                      <div className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-100">
                        <CalendarDays className="h-4 w-4 shrink-0 text-brand dark:text-brand-on-dark" aria-hidden />
                        <span className="font-medium tabular-nums">{eventDateLabel}</span>
                      </div>
                    </>
                  ) : null}
                </div>

                {gallery.description ? (
                  <p className="mt-3 border-t border-zinc-100 pt-3 text-xs leading-snug text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                    {gallery.description}
                  </p>
                ) : null}
                {gallery.selectionLocked ? (
                  <p className="mt-2 rounded-lg border border-amber-200/90 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-100">
                    Selections are temporarily locked by your photographer.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <div
          id="client-gallery-body"
          className="scroll-mt-4 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95"
        >
          <div className={cn(galleryFrameClass, "py-4")}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="-mx-1 flex min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] sm:mx-0 sm:flex-1 sm:pb-0">
                {(
                  [
                    ["all", "Originals"],
                    ["selected", "Selected"],
                    ...(showFinalsTab ? ([["edited", "Finals"]] as const) : []),
                  ] as const
                ).map(([key, label]) => {
                  const count =
                    key === "all"
                      ? uploadsCount
                      : key === "selected"
                        ? selectedCountLabel
                        : editedCount;
                  const active = photoTab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPhotoTab(key)}
                      className={`inline-flex min-h-[44px] shrink-0 snap-start items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                        active
                          ? "border-brand/40 bg-brand-soft text-brand shadow-sm dark:border-brand/50 dark:bg-brand/20 dark:text-brand-on-dark"
                          : "border-transparent bg-zinc-100/90 text-zinc-600 hover:bg-zinc-200/90 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      }`}
                    >
                      <span>{label}</span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${
                          active
                            ? "bg-white/90 text-brand dark:bg-zinc-950/50 dark:text-brand-on-dark"
                            : "bg-white/60 text-zinc-500 dark:bg-zinc-950/40 dark:text-zinc-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div
                className="-mx-1 flex max-w-[100vw] shrink-0 gap-1 overflow-x-auto pb-1 pl-1 [scrollbar-width:thin] sm:mx-0 sm:justify-end sm:pb-0 sm:pl-0"
                role="toolbar"
                aria-label="Gallery grid layout"
              >
                <div className="flex min-w-0 gap-0.5 rounded-2xl border border-zinc-200/90 bg-zinc-50/90 p-1 dark:border-zinc-800 dark:bg-zinc-900/60">
                  {GRID_LAYOUTS.map(({ id, shortLabel, icon: Icon }) => {
                    const active = gridLayout === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setGridLayout(id)}
                        title={GRID_LAYOUTS.find((g) => g.id === id)?.description}
                        aria-pressed={active}
                        className={`inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition sm:min-h-0 sm:px-3 ${
                          active
                            ? "bg-white text-brand shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-brand-on-dark dark:ring-zinc-700"
                            : "text-zinc-600 hover:bg-white/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden="true" />
                        <span className="hidden sm:inline">{shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {photoTab === "all" && selectedAssets.length > 0 ? (
        <div className="border-b border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className={cn(galleryFrameClass, "py-4")}>
            <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-zinc-50/80 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 lg:flex-row lg:items-center">
              <div className="flex min-w-0 items-center gap-3 lg:w-56">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
                  <Heart className="h-4 w-4 fill-current" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Selected media
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {selectedCountLabel} selected
                  </p>
                </div>
              </div>
              <ul
                className="-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]"
                aria-label="Selected photos"
              >
                {selectedAssets.map((a) => {
                  const isVideo = isClientAssetVideo(a);
                  const mediaSrc = (a.previewUrl ?? a.thumbUrl).trim();
                  return (
                    <li
                      key={a.id}
                      className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white bg-white shadow-sm ring-2 ring-brand/45 dark:border-zinc-900 dark:bg-zinc-950 dark:ring-brand/40 sm:h-24 sm:w-24"
                    >
                      <button
                        type="button"
                        className="relative block h-full w-full"
                        onClick={() => openLb(a.id)}
                      >
                        {isVideo ? (
                          <video
                            src={mediaSrc}
                            muted
                            playsInline
                            preload="metadata"
                            aria-label={a.originalName}
                            className="absolute inset-0 h-full w-full bg-black object-cover transition group-hover:scale-[1.03] group-hover:brightness-95"
                          />
                        ) : (
                          <Image
                            src={a.thumbUrl}
                            alt=""
                            fill
                            sizes={SELECTED_STRIP_IMAGE_SIZES}
                            quality={SHARE_GRID_IMAGE_QUALITY}
                            className="object-cover transition group-hover:scale-[1.03] group-hover:brightness-95"
                          />
                        )}
                        {isVideo ? (
                          <span className="pointer-events-none absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                            Video
                          </span>
                        ) : null}
                        <span className="sr-only">Open {a.originalName}</span>
                      </button>
                      {!editingLocked ? (
                        <button
                          type="button"
                          disabled={syncBusy}
                          onClick={(e) => {
                            e.stopPropagation();
                            void toggleSelect(a.id);
                          }}
                          className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white shadow backdrop-blur-sm transition hover:bg-black/80 disabled:opacity-40"
                          aria-label={`Remove ${a.originalName} from selection`}
                        >
                          <span className="text-xs font-bold leading-none">×</span>
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
                <button
                  type="button"
                  onClick={() => setPhotoTab("selected")}
                  className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  Review
                </button>
                <button
                  type="button"
                  disabled={syncBusy || editingLocked}
                  onClick={() => setConfirmOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-hover disabled:opacity-40 dark:hover:bg-brand-hover"
                >
                  <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {gallery.selectionSubmitted ? "Submit again" : "Submit Selection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {gallery.selectionSubmitted && !editingLocked && photoTab !== "edited" ? (
        <div className="mx-auto max-w-3xl px-4 py-3">
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
            You&apos;ve already submitted your favorites. You can still change your picks anytime
            — tap photos to add or remove selections, then submit again to update your photographer.
          </p>
        </div>
      ) : null}

      <main className={cn(galleryFrameClass, "py-8 pb-12")}>
        {gallery.coverImageUrl && !editingLocked && photoTab !== "edited" && !(photoTab === "all" && selectedAssets.length > 0) ? (
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <span className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
              <Heart className="h-3.5 w-3.5 shrink-0 text-rose-500" aria-hidden />
              <span className="tabular-nums">{selectedCountLabel}</span>
              <span className="text-zinc-500 dark:text-zinc-400">selected</span>
            </span>
            <div className="flex items-center gap-2 sm:justify-end">
              {syncBusy ? <InlineStatusSkeleton size={20} /> : null}
              <button
                type="button"
                disabled={selectedCount === 0 || syncBusy}
                onClick={() => setConfirmOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-hover disabled:opacity-40 sm:w-auto dark:hover:bg-brand-hover"
              >
                <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                {gallery.selectionSubmitted ? "Submit again" : "Submit Selection"}
              </button>
            </div>
          </div>
        ) : null}
        {photoTab === "edited" ? (
          gallery.finals.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Edited media will appear here when your photographer delivers them.
            </p>
          ) : (
            <>
              {preferInlineFinalSave && downloadableFinals.length > 0 && touchMobileFinalSaveUx?.explainer ? (
                touchMobileFinalSaveUx.explainer.variant === "in_app" ? (
                  <div className="mb-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/35">
                    <div>
                      <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                        {touchMobileFinalSaveUx.explainer.heading}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-amber-900/95 dark:text-amber-100/95">
                        {touchMobileFinalSaveUx.explainer.body}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyGalleryPageUrl()}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-300/90 bg-white px-3 py-2 text-sm font-semibold text-amber-950 shadow-sm dark:border-amber-700 dark:bg-zinc-900 dark:text-amber-50"
                    >
                      <Copy className="h-4 w-4 shrink-0" aria-hidden />
                      Copy gallery link
                    </button>
                  </div>
                ) : (
                  <p className="mb-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {touchMobileFinalSaveUx.explainer.text}
                  </p>
                )
              ) : null}
              {downloadableFinals.length > 0 ? (
                <div className="mb-4 flex justify-end">
                  <button
                    type="button"
                    disabled={downloadAllFinalsBusy}
                    onClick={() => void handleDownloadAllFinals()}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {downloadAllFinalsBusy ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                    ) : (
                      <Download className="h-4 w-4 shrink-0" aria-hidden />
                    )}
                    {downloadAllFinalsBusy ? "Preparing zip…" : "Download all"}
                  </button>
                </div>
              ) : null}
              <ul className={galleryListClass(gridLayout)}>
              {gallery.finals.map((f, index) => {
                const locked = Boolean(f.locked);
                const imgSrc = finalDisplaySrc(f, publicKey);
                const showUnlockedVideo = !locked && isShareFinalVideo(f);
                const collage = isCollageGridLayout(gridLayout);
                return (
                  <li
                    key={f.id}
                    className={collage ? editedCardClass(gridLayout, index) : `flex flex-col ${editedCardClass(gridLayout, index)}`}
                  >
                    <div className={uploadImageWrapClass(gridLayout, index)}>
                      <button
                        type="button"
                        onClick={() => openFinalLb(f.id)}
                        className={
                          collage
                            ? "block w-full border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            : "absolute inset-0 block h-full w-full border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-brand-on-dark"
                        }
                      >
                        {showUnlockedVideo ? (
                          <video
                            src={f.url}
                            {...(f.lockedPreviewUrl ? { poster: f.lockedPreviewUrl } : {})}
                            muted
                            playsInline
                            preload="metadata"
                            aria-label={f.name}
                            className={
                              collage
                                ? "block h-auto w-full cursor-zoom-in bg-black"
                                : "absolute inset-0 h-full w-full cursor-zoom-in bg-black object-cover pointer-events-none"
                            }
                          />
                        ) : collage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imgSrc}
                            alt={f.name}
                            loading={index < 12 ? "eager" : "lazy"}
                            decoding="async"
                            draggable={!locked}
                            className={cn(
                              "block h-auto w-full cursor-zoom-in",
                              locked && "select-none",
                            )}
                            onContextMenu={(e) => {
                              if (locked) e.preventDefault();
                            }}
                          />
                        ) : (
                          <Image
                            src={imgSrc}
                            alt={f.name}
                            fill
                            sizes={shareGalleryGridSizes(gridLayout, index)}
                            quality={SHARE_GRID_IMAGE_QUALITY}
                            priority={index < 10}
                            draggable={!locked}
                            className={cn(
                              "cursor-zoom-in object-cover",
                              locked && "select-none",
                            )}
                            onContextMenu={(e) => {
                              if (locked) e.preventDefault();
                            }}
                          />
                        )}
                      </button>
                      {locked ? (
                        <div
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent"
                          aria-hidden
                        />
                      ) : null}
                      <div className={galleryTileHoverActionsClass}>
                        {locked ? (
                          <span
                            className={cn(galleryTileHoverIconClass, "pointer-events-none")}
                            aria-hidden
                          >
                            <Lock className="h-4 w-4 stroke-[1.5]" />
                          </span>
                        ) : (
                          <>
                            {preferInlineFinalSave ? (
                              <button
                                type="button"
                                title={touchMobileFinalSaveUx?.saveButtonTitle}
                                aria-label={
                                  touchMobileFinalSaveUx?.saveButtonTitle ??
                                  "Save or share photo to your device"
                                }
                                disabled={finalSaveBusyId !== null}
                                aria-busy={finalSaveBusyId === f.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleDeliverFinalPhotoMobile(f);
                                }}
                                className={galleryTileHoverIconClass}
                              >
                                {finalSaveBusyId === f.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin stroke-[1.5]" aria-hidden />
                                ) : (
                                  <Download className="h-4 w-4 stroke-[1.5]" aria-hidden />
                                )}
                              </button>
                            ) : (
                              <a
                                href={getShareFinalDownloadUrl(publicKey, f.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={galleryTileHoverIconClass}
                                aria-label={`Download ${f.name}`}
                              >
                                <Download className="h-4 w-4 stroke-[1.5]" aria-hidden />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openFinalFeedback(f);
                              }}
                              className={galleryTileHoverIconClass}
                              aria-label={
                                f.flaggedByClient
                                  ? `Update feedback for ${f.name}`
                                  : `Flag ${f.name} for review`
                              }
                            >
                              <Flag
                                className={cn(
                                  "h-4 w-4 stroke-[1.5]",
                                  f.flaggedByClient && "fill-white",
                                )}
                                aria-hidden
                              />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            </>
          )
        ) : visibleAssets.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            {photoTab === "selected"
              ? "You have not selected any media yet."
              : "No media in this gallery yet."}
          </p>
        ) : (
          <ul className={galleryListClass(gridLayout)}>
            {visibleAssets.map((a, index) => {
              const isVideo = isClientAssetVideo(a);
              const mediaSrc = (a.previewUrl ?? a.thumbUrl).trim();
              const isSelected = a.selection === "SELECTED";
              return (
                <li
                  key={a.id}
                  className={uploadItemClass(gridLayout, index, isSelected)}
                >
                  <div className={uploadImageWrapClass(gridLayout, index)}>
                    <button
                      type="button"
                      className={
                        isCollageGridLayout(gridLayout)
                          ? "block w-full text-left"
                          : "absolute inset-0 block h-full w-full text-left"
                      }
                      onClick={() => openLb(a.id)}
                    >
                      {isVideo ? (
                        <video
                          src={mediaSrc}
                          muted
                          playsInline
                          preload="metadata"
                          aria-label={a.originalName}
                          className={
                            isCollageGridLayout(gridLayout)
                              ? "block h-auto w-full bg-black transition group-hover:brightness-[0.97]"
                              : "absolute inset-0 h-full w-full bg-black object-cover transition group-hover:brightness-[0.97]"
                          }
                        />
                      ) : isCollageGridLayout(gridLayout) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.thumbUrl}
                          alt={a.originalName}
                          loading={index < 12 ? "eager" : "lazy"}
                          decoding="async"
                          draggable={!gallery.rightsProtection}
                          className="block h-auto w-full transition group-hover:brightness-[0.97]"
                        />
                      ) : (
                        <Image
                          src={a.thumbUrl}
                          alt={a.originalName}
                          fill
                          sizes={shareGalleryGridSizes(gridLayout, index)}
                          quality={SHARE_GRID_IMAGE_QUALITY}
                          priority={index < 10}
                          className="object-cover transition group-hover:brightness-[0.97]"
                        />
                      )}
                      {isVideo ? (
                        <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Video
                        </span>
                      ) : null}
                    </button>

                    {photoTab === "all" ? (
                      <div className={galleryTileHoverActionsClass}>
                        <button
                          type="button"
                          disabled={editingLocked || syncBusy}
                          onClick={(e) => {
                            e.stopPropagation();
                            void toggleSelect(a.id);
                          }}
                          className={galleryTileHoverIconClass}
                          aria-label={isSelected ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart
                            className={cn(
                              "h-4 w-4 stroke-[1.5]",
                              isSelected && "fill-white",
                            )}
                            aria-hidden
                          />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {lightboxId && lbAsset ? (
        <MediaLightbox
          open
          onClose={closeAllPreviews}
          ariaLabel={`Preview — ${lbAsset.originalName}`}
          mediaKey={lbAsset.id}
          title={lbAsset.originalName}
          counter={
            lightboxNavAssets.length > 1
              ? { current: lbNavIndex + 1, total: lightboxNavAssets.length }
              : undefined
          }
          canPrevious={lbNavIndex > 0}
          canNext={lbNavIndex >= 0 && lbNavIndex < lightboxNavAssets.length - 1}
          onPrevious={() => {
            const prev = lightboxNavAssets[lbNavIndex - 1];
            if (prev) {
              setLightboxId(prev.id);
              setZoom(1);
            }
          }}
          onNext={() => {
            const next = lightboxNavAssets[lbNavIndex + 1];
            if (next) {
              setLightboxId(next.id);
              setZoom(1);
            }
          }}
          zoomEnabled={!lbAssetIsVideo}
          zoom={zoom}
          onZoomChange={setZoom}
          footer={
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between">
              <p className="hidden text-xs text-white/60 sm:block">
                Double-click or scroll to zoom · drag when zoomed
              </p>
              <button
                type="button"
                disabled={editingLocked || syncBusy}
                onClick={() => void toggleSelect(lbAsset.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition",
                  lbAsset.selection === "SELECTED"
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-900/30"
                    : "border border-white/25 bg-white/10 text-white hover:bg-white/15",
                )}
              >
                <Heart
                  className={cn(
                    "size-4 stroke-[1.5]",
                    lbAsset.selection === "SELECTED" && "fill-white",
                  )}
                  aria-hidden
                />
                {lbAsset.selection === "SELECTED" ? "Selected" : "Select photo"}
              </button>
            </div>
          }
        >
          {lbAssetIsVideo ? (
            <video
              src={lbAsset.previewUrl ?? lbAsset.thumbUrl}
              controls
              playsInline
              preload="metadata"
              aria-label={lbAsset.originalName}
              className={cn(
                lightboxMediaClass,
                "bg-black",
                gallery.rightsProtection && "select-none",
              )}
              onContextMenu={(e) => {
                if (gallery.rightsProtection) e.preventDefault();
              }}
            />
          ) : (
            <Image
              src={lbAsset.previewUrl ?? lbAsset.thumbUrl}
              alt={lbAsset.originalName}
              width={1920}
              height={1920}
              sizes={SHARE_LIGHTBOX_SIZES}
              quality={SHARE_LIGHTBOX_IMAGE_QUALITY}
              className={cn(
                lightboxMediaClass,
                gallery.rightsProtection && "select-none",
              )}
              style={{ width: "auto", height: "auto" }}
              draggable={false}
              onContextMenu={(e) => {
                if (gallery.rightsProtection) e.preventDefault();
              }}
            />
          )}
        </MediaLightbox>
      ) : null}

      {finalLb ? (
        <MediaLightbox
          open
          onClose={closeAllPreviews}
          ariaLabel={`Preview — ${finalLb.name}`}
          mediaKey={finalLb.id}
          title={finalLb.name}
          subtitle={
            finalLb.locked ? "Preview only until paid" : undefined
          }
          counter={
            gallery.finals.length > 1
              ? { current: finalLbIndex + 1, total: gallery.finals.length }
              : undefined
          }
          canPrevious={finalLbIndex > 0}
          canNext={finalLbIndex >= 0 && finalLbIndex < gallery.finals.length - 1}
          onPrevious={() => {
            const prev = gallery.finals[finalLbIndex - 1];
            if (prev) {
              setFinalLightboxId(prev.id);
              setZoom(1);
            }
          }}
          onNext={() => {
            const next = gallery.finals[finalLbIndex + 1];
            if (next) {
              setFinalLightboxId(next.id);
              setZoom(1);
            }
          }}
          zoomEnabled={!isShareFinalVideo(finalLb)}
          zoom={zoom}
          onZoomChange={setZoom}
          footer={
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              {finalLb.locked ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-200">
                  <Lock className="size-3.5 shrink-0" aria-hidden />
                  Preview only until paid
                </span>
              ) : preferInlineFinalSave ? (
                <button
                  type="button"
                  title={touchMobileFinalSaveUx?.saveButtonTitle}
                  aria-label={
                    touchMobileFinalSaveUx?.saveButtonTitle ?? "Save or share photo to your device"
                  }
                  disabled={finalSaveBusyId !== null}
                  aria-busy={finalSaveBusyId === finalLb.id}
                  onClick={() => void handleDeliverFinalPhotoMobile(finalLb)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-900 enabled:hover:bg-white/90 disabled:opacity-50"
                >
                  {finalSaveBusyId === finalLb.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                  ) : (
                    <Share2 className="size-4 shrink-0" aria-hidden />
                  )}
                  Save / Share
                </button>
              ) : (
                <a
                  href={getShareFinalDownloadUrl(publicKey, finalLb.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white/90"
                >
                  <Download className="size-4 shrink-0" aria-hidden />
                  Download
                </a>
              )}
            </div>
          }
        >
          {!finalLb.locked && isShareFinalVideo(finalLb) ? (
            <video
              src={finalLb.url}
              {...(finalLb.lockedPreviewUrl ? { poster: finalLb.lockedPreviewUrl } : {})}
              controls
              playsInline
              preload="metadata"
              aria-label={finalLb.name}
              className={cn(
                lightboxMediaClass,
                gallery.rightsProtection && "select-none",
              )}
              onContextMenu={(e) => {
                if (gallery.rightsProtection) e.preventDefault();
              }}
            />
          ) : (
            <Image
              src={finalDisplaySrc(finalLb, publicKey)}
              alt={finalLb.name}
              width={1920}
              height={1920}
              sizes={SHARE_LIGHTBOX_SIZES}
              quality={SHARE_LIGHTBOX_IMAGE_QUALITY}
              className={cn(
                lightboxMediaClass,
                gallery.rightsProtection && "select-none",
                finalLb.locked && "select-none",
              )}
              style={{ width: "auto", height: "auto" }}
              draggable={!finalLb.locked}
              onContextMenu={(e) => {
                if (finalLb.locked || gallery.rightsProtection) e.preventDefault();
              }}
            />
          )}
        </MediaLightbox>
      ) : null}

      {finalFeedback ? (
        <div className="fixed inset-0 z-[64] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Close feedback"
            onClick={() => {
              if (!finalFeedbackBusy) setFinalFeedback(null);
            }}
          />
          <div
            className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            role="dialog"
            aria-modal="true"
            aria-label={`Flag final: ${finalFeedback.finalName}`}
          >
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {finalFeedback.flaggedByClient ? "Update final feedback" : "Flag this final"}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Tell your photographer what should be adjusted for {finalFeedback.finalName}.
            </p>
            {finalFeedback.photographerReply ? (
              <div className="mt-4 rounded-xl border border-brand/15 bg-brand-soft/60 px-3 py-2.5 dark:border-brand/25 dark:bg-brand/10">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-ink dark:text-brand-on-dark">
                  Photographer reply
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
                  {finalFeedback.photographerReply}
                </p>
              </div>
            ) : null}
            <FormTextArea
              value={finalFeedback.comment}
              onChange={(e) =>
                setFinalFeedback((current) =>
                  current ? { ...current, comment: e.target.value } : current,
                )
              }
              rows={4}
              placeholder="Example: Skin tone looks too warm. Please re-edit."
              className="mt-4 [&_.ant-input]:!resize-none [&_.ant-input]:!rounded-xl"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={finalFeedbackBusy}
                onClick={() => setFinalFeedback(null)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={finalFeedbackBusy || finalFeedback.comment.trim().length === 0}
                onClick={() => void submitFinalFeedback()}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {finalFeedbackBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Flag className="h-4 w-4" aria-hidden />
                )}
                {finalFeedback.flaggedByClient ? "Update" : "Flag"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {coverLightboxOpen && gallery.coverImageUrl ? (
        <MediaLightbox
          open
          onClose={closeAllPreviews}
          ariaLabel="Cover preview"
          mediaKey={gallery.coverImageUrl}
          title={displayTitle ? `Cover — ${displayTitle}` : "Gallery cover"}
          zoom={zoom}
          onZoomChange={setZoom}
        >
          <Image
            src={gallery.coverImageUrl}
            alt={displayTitle ? `Cover — ${displayTitle}` : "Gallery cover"}
            width={1920}
            height={1920}
            sizes={SHARE_LIGHTBOX_SIZES}
            quality={SHARE_LIGHTBOX_IMAGE_QUALITY}
            className={cn(
              lightboxMediaClass,
              "object-center",
              gallery.rightsProtection && "select-none",
            )}
            style={{ ...coverImageObjectPosition, width: "auto", height: "auto" }}
            draggable={false}
            onContextMenu={(e) => {
              if (gallery.rightsProtection) e.preventDefault();
            }}
          />
        </MediaLightbox>
      ) : null}

      {musicAllowed ? (
        <>
          <audio
            ref={audioRef}
            key={galleryMusicUrl}
            src={galleryMusicUrl}
            autoPlay
            loop
            playsInline
            preload="auto"
            className="sr-only"
            aria-hidden
            onCanPlay={() => playGalleryMusic()}
          />
          <div className="fixed bottom-4 right-4 z-[52] sm:bottom-6 sm:right-6">
            <button
              type="button"
              onClick={toggleGalleryMusic}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-zinc-200/90 bg-white/95 text-zinc-900 shadow-lg backdrop-blur-sm transition hover:bg-white dark:border-zinc-600 dark:bg-zinc-900/95 dark:text-zinc-50 dark:hover:bg-zinc-900",
                galleryMusicStarted && !galleryMusicMuted ? "w-11 px-0" : "px-4",
              )}
              aria-label={
                galleryMusicStarted && !galleryMusicMuted
                  ? "Mute gallery music"
                  : "Play gallery music"
              }
            >
              {galleryMusicStarted && !galleryMusicMuted ? (
                <Volume2 className="h-5 w-5" aria-hidden />
              ) : (
                <>
                  {galleryMusicMuted ? (
                    <VolumeX className="h-5 w-5" aria-hidden />
                  ) : (
                    <Volume2 className="h-5 w-5" aria-hidden />
                  )}
                  <span className="text-xs font-semibold">Play music</span>
                </>
              )}
            </button>
          </div>
        </>
      ) : null}

      {confirmOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => setConfirmOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {gallery.selectionSubmitted ? "Submit updated selection?" : "Submit your selection?"}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              {gallery.selectionSubmitted
                ? `You have selected ${selectedCountLabel} image${selectedCount === 1 ? "" : "s"}. This sends your latest picks to your photographer.`
                : `You selected ${selectedCountLabel} image${selectedCount === 1 ? "" : "s"}. This sends your picks to your photographer.`}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={syncBusy}
                onClick={() => void submitSelections()}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-black"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {photoSaveAssist ? (
        <div
          className="fixed inset-0 z-[72] flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
          aria-label={`Save photo: ${photoSaveAssist.label}`}
        >
          <div className="flex shrink-0 flex-col gap-3 border-b border-white/10 bg-zinc-950/95 px-4 pb-4 pt-[max(env(safe-area-inset-top),1rem)] backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 flex-1 pt-2 text-sm font-medium leading-snug text-white">
                Save to your device
              </p>
              <button
                type="button"
                onClick={() => closePhotoSaveAssist()}
                className="shrink-0 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm"
              >
                Done
              </button>
            </div>
            <p className="text-xs leading-relaxed text-zinc-300">
              Touch and hold the image below. Choose Save Image or Save to Photos (iPhone) or Share / Save image
              (Android).
            </p>
            {photoSaveAssist.suggestOpenExternally ? (
              <>
                <p className="text-xs leading-relaxed text-amber-100/90">
                  Easiest Save to Photos: copy the gallery link, open Safari or Chrome, paste the URL, tap Save /
                  Share there.
                </p>
                <button
                  type="button"
                  onClick={() => void copyGalleryPageUrl()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white"
                >
                  <Copy className="h-4 w-4 shrink-0" aria-hidden />
                  Copy gallery link
                </button>
              </>
            ) : (
              <p className="text-xs leading-relaxed text-zinc-400">
                Prefer the Share menu? Close this preview and tap Save / Share once more when your browser offers it.
              </p>
            )}
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoSaveAssist.objectUrl}
              alt={photoSaveAssist.label}
              draggable={false}
              className="max-h-full max-w-full touch-manipulation select-auto object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}