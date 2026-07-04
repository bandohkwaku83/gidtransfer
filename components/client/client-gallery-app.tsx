"use client";

/**
 * Public client gallery (`/g/...`, `/[companySlug]/[gallerySlug]`).
 * Self-contained marketing-style UI: cover, layout modes, selection hearts, zoom lightbox.
 * Do not conflate with photographer `folder-detail-view` dashboard grids.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  CalendarDays,
  Copy,
  Download,
  Flag,
  Heart,
  Loader2,
  Lock,
  MessageCircle,
  MoreVertical,
  PlayCircle,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  clientInitials,
  canDownloadShareFinal,
  editedCardClass,
  finalDisplaySrc,
  GalleryViewMoreButton,
  GALLERY_MUSIC_MUTE_PREFIX,
  GRID_LAYOUTS,
  GRID_STORAGE_PREFIX,
  galleryListClass,
  isClientAssetVideo,
  isCollageGridLayout,
  isShareFinalVideo,
  normalizeGalleryImageLayout,
  SHARE_GALLERY_INITIAL_VISIBLE,
  SHARE_GALLERY_LOAD_MORE_COUNT,
  toDemoAssets,
  uploadImageWrapClass,
  uploadItemClass,
  type GridLayout,
} from "@/components/client/share-gallery-bits";
import { useToast } from "@/components/toast-provider";
import { FormTextArea } from "@/components/ui/form-input";
import type { DemoAsset, SelectionState } from "@/lib/demo-data";
import { folderCoverObjectPositionStyle, type ApiFolder } from "@/lib/folders-api";
import { galleryFontStack, useGalleryGoogleFonts } from "@/lib/gallery-typography";
import {
  readAllowDownloadsFromApiBody,
  fetchShareFinalDownloadBlob,
  tryNavigatorShareFinalPhoto,
  getShareGallery,
  downloadShareFinalsZip,
  patchShareGalleryFinalComment,
  postShareGalleryFinalFlag,
  postShareGalleryPhotoComment,
  postShareGalleryUnlock,
  postShareGalleryAccessEmail,
  submitShareGallerySelectionsToPhotographer,
  type NormalizedShareGallery,
  ShareGalleryError,
  isShareGalleryPasswordRequiredError,
  syncShareGallerySelections,
  type PublicGalleryKey,
  type ShareGalleryFinal,
  publicGallerySessionId,
} from "@/lib/share-gallery-api";
import { usePreferInlineFinalSave } from "@/lib/use-prefer-inline-final-save";
import { useShareSaveHints } from "@/lib/use-share-save-hints";
import { cn } from "@/lib/utils";
import {
  APP_NAME,
  MARKETING_SITE_ORIGIN,
  studioLogoSrc as resolveStudioLogoSrc,
} from "@/lib/branding";
import { GalleryAccessGate } from "@/components/client/gallery-access-gate";
import { GalleryEmailGate } from "@/components/client/gallery-email-gate";
import { ClientGalleryAssetGrid } from "@/components/client/client-gallery-asset-grid";
import { ClientGallerySetBar } from "@/components/client/client-gallery-set-bar";
import { ClientPreviewWatermarkOverlay } from "@/components/client/preview-watermark-overlay";
import { GalleryCoverHero } from "@/components/client/gallery-cover-hero";
import { lightboxMediaClass } from "@/components/ui/media-lightbox";
import {
  LazyGalleryBlogClientSection,
  LazyMediaLightbox,
} from "@/lib/lazy-components";
import { mergeGalleryAccessSettings } from "@/lib/gallery-access-merge";
import {
  hasGalleryEmailAccess,
  recordGalleryAccessEmail,
  writeGalleryEmailSession,
} from "@/lib/gallery-email-access";
import {
  filterMediaByGallerySet,
  readMediaSetId,
  type GallerySetFilter,
  sortGallerySets,
} from "@/lib/gallery-set-filter";
import {
  ensureDemoGalleryBlogSeed,
  listPublishedGalleryBlogPostsForShare,
  resolveGalleryBlogFolderId,
} from "@/lib/gallery-blog";
import {
  clientGalleryLightboxSrc,
  shouldShowClientPreviewWatermarkOverlay,
} from "@/lib/preview-watermark-display";

type GalleryPhotoTab = "all" | "selected" | "edited" | "blog";

function VideoTileOverlay() {
  return (
    <span className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-black/10 text-white">
      <PlayCircle className="h-9 w-9 drop-shadow-md" aria-hidden />
    </span>
  );
}

function tileActionClass(active = false): string {
  return cn(
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/45 text-white shadow-sm backdrop-blur-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:cursor-not-allowed disabled:opacity-45",
    active ? "bg-brand/90 hover:bg-brand" : "bg-black/35 hover:bg-black/60",
  );
}

export function ClientGalleryApp({ publicKey }: { publicKey: PublicGalleryKey }) {
  const sessionId = publicGallerySessionId(publicKey);
  const { showToast } = useToast();
  const [gallery, setGallery] = useState<NormalizedShareGallery | null>(null);
  const [assets, setAssets] = useState<DemoAsset[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "locked" | "error" | "ok">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [emailAccessGranted, setEmailAccessGranted] = useState(() =>
    hasGalleryEmailAccess(sessionId),
  );
  const [galleryGridKey, setGalleryGridKey] = useState(0);
  const [syncBusy, setSyncBusy] = useState(false);
  const [submitSelectionsBusy, setSubmitSelectionsBusy] = useState(false);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [finalLightboxId, setFinalLightboxId] = useState<string | null>(null);
  const [coverLightboxOpen, setCoverLightboxOpen] = useState(false);
  const [photoTab, setPhotoTab] = useState<GalleryPhotoTab>("all");
  const [setFilter, setSetFilter] = useState<GallerySetFilter>("all");
  const [publishedBlogCount, setPublishedBlogCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [gridLayout, setGridLayout] = useState<GridLayout>("masonry");
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);
  const layoutMenuRef = useRef<HTMLDivElement>(null);
  const layoutMenuPanelRef = useRef<HTMLDivElement>(null);
  const layoutMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [layoutMenuPosition, setLayoutMenuPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const [visibleMediaLimit, setVisibleMediaLimit] = useState(SHARE_GALLERY_INITIAL_VISIBLE);
  const [downloadAllFinalsBusy, setDownloadAllFinalsBusy] = useState(false);
  const [finalSaveBusyId, setFinalSaveBusyId] = useState<string | null>(null);
  const [finalFeedback, setFinalFeedback] = useState<{
    finalId: string;
    finalName: string;
    comment: string;
    savedComment: string;
    flaggedByClient: boolean;
    photographerReply?: string;
    editing: boolean;
  } | null>(null);
  const [finalFeedbackBusy, setFinalFeedbackBusy] = useState(false);
  const [photoComment, setPhotoComment] = useState<{
    photoId: string;
    photoName: string;
    comment: string;
    savedComment: string;
    photographerReply?: string;
    readOnly: boolean;
    editing: boolean;
  } | null>(null);
  const [photoCommentBusy, setPhotoCommentBusy] = useState(false);
  const [photoSaveAssist, setPhotoSaveAssist] = useState<{
    objectUrl: string;
    label: string;
    suggestOpenExternally: boolean;
  } | null>(null);

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
  const galleryMusicMutedRef = useRef(galleryMusicMuted);
  const galleryMusicStartedRef = useRef(galleryMusicStarted);
  galleryMusicMutedRef.current = galleryMusicMuted;
  galleryMusicStartedRef.current = galleryMusicStarted;

  useEffect(() => {
    initialPhotoTabAppliedRef.current = false;
    setSetFilter("all");
    setVisibleMediaLimit(SHARE_GALLERY_INITIAL_VISIBLE);
    setEmailAccessGranted(hasGalleryEmailAccess(sessionId));
    setGalleryGridKey(0);
  }, [sessionId]);

  useEffect(() => {
    setVisibleMediaLimit(SHARE_GALLERY_INITIAL_VISIBLE);
  }, [photoTab, setFilter]);

  const updateLayoutMenuPosition = useCallback(() => {
    const button = layoutMenuButtonRef.current;
    if (!button) {
      setLayoutMenuPosition(null);
      return;
    }
    const rect = button.getBoundingClientRect();
    setLayoutMenuPosition({
      top: rect.bottom + 6,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, []);

  useLayoutEffect(() => {
    if (!layoutMenuOpen) {
      setLayoutMenuPosition(null);
      return;
    }
    updateLayoutMenuPosition();
    window.addEventListener("resize", updateLayoutMenuPosition);
    window.addEventListener("scroll", updateLayoutMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateLayoutMenuPosition);
      window.removeEventListener("scroll", updateLayoutMenuPosition, true);
    };
  }, [layoutMenuOpen, updateLayoutMenuPosition]);

  useEffect(() => {
    if (!layoutMenuOpen) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (layoutMenuRef.current?.contains(target)) return;
      if (layoutMenuPanelRef.current?.contains(target)) return;
      setLayoutMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLayoutMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [layoutMenuOpen]);

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

  useEffect(() => {
    if (!gallery?.imageLayout) return;
    try {
      const key = `${GRID_STORAGE_PREFIX}${sessionId}`;
      const clientOverride = sessionStorage.getItem(key);
      if (!clientOverride) {
        setGridLayout(normalizeGalleryImageLayout(gallery.imageLayout));
      }
    } catch {
      /* ignore */
    }
  }, [gallery?.imageLayout, sessionId]);

  useGalleryGoogleFonts(gallery?.titleFont, gallery?.bodyFont);

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
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) {
        audio.pause();
        return;
      }
      if (!galleryMusicMutedRef.current && galleryMusicStartedRef.current) {
        void audio.play().catch(() => {});
      }
    };
    window.addEventListener("pagehide", stopMusic);
    window.addEventListener("beforeunload", stopMusic);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", stopMusic);
      window.removeEventListener("beforeunload", stopMusic);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (cleanupAudio) {
        cleanupAudio.pause();
        cleanupAudio.currentTime = 0;
      }
    };
  }, [galleryMusicUrl, musicAllowed]);

  const toggleGalleryMusic = useCallback(() => {
    if (!musicAllowed) return;
    const audio = audioRef.current;

    if (galleryMusicMuted) {
      setGalleryMusicMuted(false);
      try {
        sessionStorage.removeItem(`${GALLERY_MUSIC_MUTE_PREFIX}${sessionId}`);
      } catch {
        /* ignore */
      }
      playGalleryMusic({ ignoreMuted: true });
      return;
    }

    setGalleryMusicMuted(true);
    audio?.pause();
    try {
      sessionStorage.setItem(`${GALLERY_MUSIC_MUTE_PREFIX}${sessionId}`, "1");
    } catch {
      /* ignore */
    }
  }, [galleryMusicMuted, musicAllowed, playGalleryMusic, sessionId]);

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
    if (gallery.emailGateEnabled && !emailAccessGranted) return;
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

    const showFinals = gallery.finalDelivery === true;

    if (tabParam === "selected" || viewParam === "selected") {
      setPhotoTab("selected");
      return;
    }
    // if (tabParam === "blog" || viewParam === "blog") {
    //   setPhotoTab("blog");
    //   return;
    // }
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
  }, [gallery, loadState, emailAccessGranted]);

  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");
    setLoadError(null);
    setGallery(null);
    setAssets([]);

    getShareGallery(publicKey, undefined, { sessionId })
      .then((g) => {
        if (cancelled) return;
        const merged = mergeGalleryAccessSettings(g, sessionId);
        setGallery(merged);
        setAssets(toDemoAssets(merged.assets.filter((a) => !a.removedFromBrowse)));
        setLoadState("ok");
      })
      .catch((err) => {
        if (cancelled) return;
        if (isShareGalleryPasswordRequiredError(err)) {
          setGallery(null);
          setAssets([]);
          setLoadError(null);
          setLoadState("locked");
          return;
        }
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
  }, [publicKey, sessionId]);

  useEffect(() => {
    if (loadState !== "ok" || !gallery) {
      setPublishedBlogCount(0);
      return;
    }
    const folderId = resolveGalleryBlogFolderId({
      folderId: gallery.folderId,
      publicKey,
    });
    if (!folderId) {
      setPublishedBlogCount(0);
      return;
    }
    ensureDemoGalleryBlogSeed(
      folderId,
      assets.slice(0, 6).map((a) => a.id),
    );
    setPublishedBlogCount(
      listPublishedGalleryBlogPostsForShare({ folderId, publicKey }).length,
    );
  }, [gallery, loadState, publicKey, assets]);

  const editingLocked = useMemo(() => {
    if (!gallery) return true;
    return !gallery.canEditSelections || gallery.selectionLocked;
  }, [gallery]);

  /** When false, hide all client download / save-to-device actions on finals. */
  const finalsDownloadsAllowed = gallery?.allowDownloads !== false;

  const showFinalsTab = gallery?.finalDelivery === true;
  // const showBlogTab = publishedBlogCount > 0;
  const showBlogTab = false;
  const isPhotoGridTab = photoTab !== "blog";

  const selectedCount = assets.filter((a) => a.selection === "SELECTED").length;
  const selectionLimit = gallery?.selectionLimit ?? null;
  const selectionAtLimit =
    selectionLimit != null && selectedCount >= selectionLimit;
  const editedCount = gallery?.finals.length ?? 0;
  const uploadsCount = gallery?.counts?.uploads ?? assets.length;

  const gallerySets = useMemo(
    () =>
      sortGallerySets(gallery?.sets ?? []).filter(
        (s) => !s.counts || s.counts.uploads > 0 || s.counts.finals > 0,
      ),
    [gallery?.sets],
  );

  const showGallerySets = gallerySets.length > 0 && isPhotoGridTab;

  useEffect(() => {
    if (setFilter === "all") return;
    if (!gallerySets.some((s) => s.id === setFilter)) {
      setSetFilter("all");
    }
  }, [gallerySets, setFilter]);

  const tabAssets = useMemo(() => {
    if (photoTab === "blog") return [];
    if (photoTab === "selected") {
      const picks = gallery?.selectionAssets;
      if (picks?.length) {
        const liveById = new Map(assets.map((a) => [a.id, a]));
        return picks.map((sa) => liveById.get(sa.id) ?? toDemoAssets([sa])[0]!);
      }
      return assets.filter((a) => a.selection === "SELECTED");
    }
    if (photoTab === "edited") return [];
    return assets;
  }, [assets, photoTab, gallery?.selectionAssets]);

  const useStackedSetSections =
    photoTab === "all" && setFilter === "all" && gallerySets.length > 0;

  const uploadSections = useMemo(() => {
    if (!useStackedSetSections) return null;
    const sections: { id: string; title: string; assets: DemoAsset[] }[] = [];
    for (const set of gallerySets) {
      if (set.counts && set.counts.uploads === 0 && set.counts.finals === 0) {
        continue;
      }
      const setAssets = tabAssets.filter((a) => readMediaSetId(a) === set.id);
      if (setAssets.length > 0) {
        sections.push({ id: set.id, title: set.name, assets: setAssets });
      }
    }
    const unsorted = tabAssets.filter((a) => readMediaSetId(a) === null);
    if (unsorted.length > 0) {
      sections.push({ id: "__unsorted__", title: "Other", assets: unsorted });
    }
    return sections.length > 0 ? sections : null;
  }, [useStackedSetSections, gallerySets, tabAssets]);

  const setBarCountItems = useMemo(() => {
    if (photoTab === "edited") return gallery?.finals ?? [];
    return tabAssets;
  }, [photoTab, tabAssets, gallery?.finals]);

  const visibleAssets = useMemo(
    () => filterMediaByGallerySet(tabAssets, setFilter),
    [tabAssets, setFilter],
  );

  const tabFinals = useMemo(() => gallery?.finals ?? [], [gallery?.finals]);

  const visibleFinals = useMemo(
    () => filterMediaByGallerySet(tabFinals, setFilter),
    [tabFinals, setFilter],
  );

  const displayedFinals = useMemo(
    () => visibleFinals.slice(0, visibleMediaLimit),
    [visibleFinals, visibleMediaLimit],
  );

  const displayedAssets = useMemo(
    () => visibleAssets.slice(0, visibleMediaLimit),
    [visibleAssets, visibleMediaLimit],
  );

  const hasMoreFinals = visibleFinals.length > visibleMediaLimit;
  const hasMoreAssets = visibleAssets.length > visibleMediaLimit;
  const remainingFinalsCount = Math.max(0, visibleFinals.length - visibleMediaLimit);
  const remainingAssetsCount = Math.max(0, visibleAssets.length - visibleMediaLimit);

  const loadMoreGalleryMedia = useCallback(() => {
    setVisibleMediaLimit((n) => n + SHARE_GALLERY_LOAD_MORE_COUNT);
  }, []);

  const downloadableFinals = useMemo(
    () =>
      visibleFinals.filter((f) => canDownloadShareFinal(f, finalsDownloadsAllowed)),
    [visibleFinals, finalsDownloadsAllowed],
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

  const applyDownloadsDisabledFromError = useCallback((body: unknown) => {
    if (readAllowDownloadsFromApiBody(body) === false) {
      setGallery((current) => (current ? { ...current, allowDownloads: false } : current));
    }
  }, []);

  const handleDownloadFinalDesktop = useCallback(
    async (f: ShareGalleryFinal) => {
      if (!finalsDownloadsAllowed || finalSaveBusyId !== null) return;
      const id = f.id;
      setFinalSaveBusyId(id);
      try {
        const blob = await fetchShareFinalDownloadBlob(publicKey, f);
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = f.name || `final-${f.id}`;
        anchor.rel = "noopener";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
        showToast("Download started.", "success");
      } catch (e) {
        if (e instanceof ShareGalleryError) {
          applyDownloadsDisabledFromError(e.body);
          showToast(e.message, "error");
        } else {
          showToast(
            e instanceof Error ? e.message : "Could not download this file.",
            "error",
          );
        }
      } finally {
        setFinalSaveBusyId((current) => (current === id ? null : current));
      }
    },
    [
      applyDownloadsDisabledFromError,
      finalsDownloadsAllowed,
      finalSaveBusyId,
      publicKey,
      showToast,
    ],
  );

  const handleDeliverFinalPhotoMobile = useCallback(
    async (f: ShareGalleryFinal) => {
      if (!finalsDownloadsAllowed || downloadAllFinalsBusy || finalDeliverLock.current) return;
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
        if (e instanceof ShareGalleryError) {
          applyDownloadsDisabledFromError(e.body);
          showToast(e.message, "error");
        } else {
          showToast(
            e instanceof Error ? e.message : "Could not load this photo.",
            "error",
          );
        }
      } finally {
        finalDeliverLock.current = false;
        setFinalSaveBusyId((cur) => (cur === id ? null : cur));
      }
    },
    [publicKey, showToast, downloadAllFinalsBusy, shareHints.inAppSocialWebView, finalsDownloadsAllowed, applyDownloadsDisabledFromError],
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

  const refetchGallery = useCallback(async () => {
    const g = await getShareGallery(publicKey, undefined, { sessionId });
    const merged = mergeGalleryAccessSettings(g, sessionId);
    setGallery(merged);
    setAssets(toDemoAssets(merged.assets.filter((a) => !a.removedFromBrowse)));
    return merged;
  }, [publicKey, sessionId]);

  const handleGalleryUnlock = useCallback(
    async (entered: string): Promise<boolean> => {
      try {
        const g = await postShareGalleryUnlock(publicKey, entered);
        const merged = mergeGalleryAccessSettings(g, sessionId);
        setGallery(merged);
        setAssets(toDemoAssets(merged.assets.filter((a) => !a.removedFromBrowse)));
        setLoadState("ok");
        return true;
      } catch (e) {
        if (e instanceof ShareGalleryError && e.status === 401) {
          return false;
        }
        throw e;
      }
    },
    [publicKey, sessionId],
  );

  const handleEmailGateSubmit = useCallback(
    async (email: string): Promise<boolean> => {
      const trimmed = email.trim();
      if (!trimmed) return false;
      try {
        writeGalleryEmailSession(sessionId, trimmed);
        if (gallery?.folderId) {
          recordGalleryAccessEmail(gallery.folderId, trimmed);
        }
        try {
          await postShareGalleryAccessEmail(publicKey, trimmed);
        } catch {
          /* Demo / offline — refetch may still succeed with visitor email header. */
        }
        await refetchGallery();
        setGalleryGridKey((key) => key + 1);
        setEmailAccessGranted(true);
        return true;
      } catch {
        return false;
      }
    },
    [gallery?.folderId, publicKey, refetchGallery, sessionId],
  );

  async function handleDownloadAllFinals() {
    if (!gallery || !finalsDownloadsAllowed || downloadableFinals.length === 0 || downloadAllFinalsBusy)
      return;
    setDownloadAllFinalsBusy(true);
    try {
      await downloadShareFinalsZip(
        publicKey,
        downloadableFinals.map((f) => ({ id: f.id, name: f.name })),
      );
      showToast("Download started.", "success");
    } catch (e) {
      if (e instanceof ShareGalleryError) {
        applyDownloadsDisabledFromError(e.body);
        showToast(e.message, "error");
      } else {
        showToast(
          e instanceof Error ? e.message : "Could not download all files.",
          "error",
        );
      }
    } finally {
      setDownloadAllFinalsBusy(false);
    }
  }

  function openFinalFeedback(f: ShareGalleryFinal) {
    if (f.locked) return;
    const comment = f.clientComment?.trim() ?? "";
    const hasExisting = Boolean(f.flaggedByClient) || comment.length > 0;
    setFinalFeedback({
      finalId: f.id,
      finalName: f.name,
      comment,
      savedComment: comment,
      flaggedByClient: Boolean(f.flaggedByClient),
      photographerReply: f.photographerReply?.trim() || undefined,
      editing: !hasExisting,
    });
  }

  function openPhotoComment(asset: Pick<DemoAsset, "id" | "originalName" | "clientComment" | "photographerReply">) {
    const comment = asset.clientComment?.trim() ?? "";
    const readOnly = editingLocked;
    setPhotoComment({
      photoId: asset.id,
      photoName: asset.originalName,
      comment,
      savedComment: comment,
      photographerReply: asset.photographerReply?.trim() || undefined,
      readOnly,
      editing: !readOnly && comment.length === 0,
    });
  }

  function closeFinalFeedbackEdit() {
    setFinalFeedback((current) => {
      if (!current) return null;
      const hadSaved =
        current.flaggedByClient || current.savedComment.trim().length > 0;
      if (hadSaved) {
        return { ...current, editing: false, comment: current.savedComment };
      }
      return null;
    });
  }

  function closePhotoCommentEdit() {
    setPhotoComment((current) => {
      if (!current) return null;
      if (current.readOnly) return null;
      if (current.savedComment.trim().length > 0) {
        return { ...current, editing: false, comment: current.savedComment };
      }
      return null;
    });
  }

  async function submitPhotoComment() {
    if (!photoComment || photoCommentBusy || photoComment.readOnly) return;
    const comment = photoComment.comment.trim();
    if (!comment) {
      showToast("Add a note for your photographer before saving.", "error");
      return;
    }
    setPhotoCommentBusy(true);
    try {
      await postShareGalleryPhotoComment(publicKey, photoComment.photoId, comment);
      setAssets((current) =>
        current.map((a) =>
          a.id === photoComment.photoId ? { ...a, clientComment: comment } : a,
        ),
      );
      setGallery((current) =>
        current
          ? {
              ...current,
              assets: current.assets.map((a) =>
                a.id === photoComment.photoId ? { ...a, clientComment: comment } : a,
              ),
            }
          : current,
      );
      showToast("Note saved.", "success");
      setPhotoComment((current) =>
        current
          ? { ...current, savedComment: comment, comment, editing: false }
          : null,
      );
    } catch (e) {
      showToast(
        e instanceof ShareGalleryError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not save note.",
        "error",
      );
    } finally {
      setPhotoCommentBusy(false);
    }
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
      setFinalFeedback((current) =>
        current
          ? {
              ...current,
              savedComment: comment,
              comment,
              flaggedByClient: true,
              editing: false,
            }
          : null,
      );
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

  async function handleSubmitSelections() {
    if (!gallery || editingLocked || submitSelectionsBusy || selectedCount === 0) return;
    setSubmitSelectionsBusy(true);
    try {
      await submitShareGallerySelectionsToPhotographer(publicKey);
      const g = await refetchGallery();
      showToast(
        g.selectionSubmitted
          ? "Selections updated for your photographer."
          : "Selections sent to your photographer.",
        "success",
      );
    } catch (e) {
      showToast(
        e instanceof ShareGalleryError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not submit selections.",
        "error",
      );
    } finally {
      setSubmitSelectionsBusy(false);
    }
  }

  async function toggleSelect(id: string) {
    if (editingLocked || syncBusy) return;
    const asset = assets.find((a) => a.id === id);
    if (!asset) return;
    if (asset.selection !== "SELECTED") {
      const max = gallery?.selectionLimit;
      if (max != null && selectedCount >= max) {
        showToast(
          `You can select up to ${max} photo${max === 1 ? "" : "s"}.`,
          "error",
        );
        return;
      }
    }
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

  const lbAsset =
    lightboxId ? assets.find((a) => a.id === lightboxId) ?? null : null;
  const lbAssetHasComment = Boolean(lbAsset?.clientComment?.trim());
  const lbAssetIsVideo = lbAsset ? isClientAssetVideo(lbAsset) : false;
  const lbNavIndex = lbAsset
    ? lightboxNavAssets.findIndex((a) => a.id === lbAsset.id)
    : -1;

  const finalLb =
    gallery && finalLightboxId
      ? visibleFinals.find((f) => f.id === finalLightboxId) ?? null
      : null;
  const finalLbIndex =
    finalLb && gallery ? visibleFinals.findIndex((f) => f.id === finalLb.id) : -1;

  useEffect(() => {
    if (photoTab !== "edited") setFinalLightboxId(null);
  }, [photoTab]);

  useEffect(() => {
    if (
      finalLightboxId &&
      gallery &&
      !visibleFinals.some((f) => f.id === finalLightboxId)
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

        if (finalLightboxId && gallery && visibleFinals.length > 0) {
          if (e.key === "ArrowLeft" && finalLbIndex > 0) {
            e.preventDefault();
            const prev = visibleFinals[finalLbIndex - 1];
            if (prev) {
              setFinalLightboxId(prev.id);
              setZoom(1);
            }
          } else if (
            e.key === "ArrowRight" &&
            finalLbIndex >= 0 &&
            finalLbIndex < visibleFinals.length - 1
          ) {
            e.preventDefault();
            const next = visibleFinals[finalLbIndex + 1];
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
  const galleryFrameClass = "mx-auto max-w-[1920px] px-3 sm:px-5";
  const studioLogoSrc = resolveStudioLogoSrc(gallery?.studio?.logoSrc);
  const studioDisplayName = gallery?.studio?.companyName?.trim() || APP_NAME;
  const previewWatermarkEnabled = gallery?.watermarkPreviewEnabled === true;
  const previewWatermarkLabel = studioDisplayName;
  const titleFamily = galleryFontStack(gallery?.titleFont, "serif");
  const bodyFamily = galleryFontStack(gallery?.bodyFont, "sans-serif");
  const galleryBodyStyle = bodyFamily ? ({ fontFamily: bodyFamily } as const) : undefined;
  const galleryTitleStyle = titleFamily ? ({ fontFamily: titleFamily } as const) : undefined;

  if (loadState === "loading") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <span className="sr-only">Loading gallery…</span>
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400 dark:text-zinc-500" aria-hidden />
      </div>
    );
  }

  if (loadState === "locked") {
    return <GalleryAccessGate onUnlock={handleGalleryUnlock} />;
  }

  if (loadState === "ok" && gallery?.emailGateEnabled && !emailAccessGranted) {
    return (
      <GalleryEmailGate
        studioName={studioDisplayName}
        onSubmit={handleEmailGateSubmit}
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
            getShareGallery(publicKey, undefined, { sessionId })
              .then((g) => {
                const merged = mergeGalleryAccessSettings(g, sessionId);
                setGallery(merged);
                setAssets(toDemoAssets(merged.assets.filter((a) => !a.removedFromBrowse)));
                setLoadState("ok");
              })
              .catch((err) => {
                if (isShareGalleryPasswordRequiredError(err)) {
                  setGallery(null);
                  setAssets([]);
                  setLoadError(null);
                  setLoadState("locked");
                  return;
                }
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
      style={galleryBodyStyle}
    >
      <header className="relative">
        {gallery.coverImageUrl ? (
          <GalleryCoverHero
            coverImageUrl={gallery.coverImageUrl}
            coverFrame={coverFrame}
            coverColor={gallery.coverColor}
            objectPosition={coverImageObjectPosition}
            displayTitle={displayTitle}
            selectionLocked={gallery.selectionLocked}
            onCoverClick={() => openCoverLb()}
            studioLogoSrc={studioLogoSrc}
            titleFont={gallery.titleFont}
            bodyFont={gallery.bodyFont}
            coverTextColor={gallery.coverTextColor}
            coverButtonColor={gallery.coverButtonColor}
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
                  src={studioLogoSrc}
                  alt={`${studioDisplayName} logo`}
                  width={140}
                  height={44}
                  className="h-8 w-auto max-w-[140px] object-contain drop-shadow-sm sm:h-9"
                  priority
                />
              </div>
            </div>

            <div className={cn(galleryFrameClass, "relative pb-2")}>
              <h1
                className="text-balance text-2xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-3xl dark:text-white"
                style={galleryTitleStyle}
              >
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
                {selectionLimit != null && !editingLocked ? (
                  <p className="mt-2 rounded-lg border border-zinc-200/90 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
                    Select up to{" "}
                    <span className="font-semibold tabular-nums">{selectionLimit}</span>{" "}
                    photo{selectionLimit === 1 ? "" : "s"}.
                    {selectionAtLimit ? " You've reached the limit." : null}
                  </p>
                ) : null}
                {!editingLocked && selectedCount > 0 ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={submitSelectionsBusy || syncBusy}
                      onClick={() => void handleSubmitSelections()}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                    >
                      {submitSelectionsBusy ? (
                        <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
                      ) : null}
                      {gallery.selectionSubmitted ? "Update selections" : "Submit selections"}
                    </button>
                    {gallery.selectionSubmitted ? (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        Your photographer has been notified.
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <div
          id="client-gallery-body"
          className="relative z-40 scroll-mt-4 overflow-visible border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95"
        >
          <div className="mx-auto max-w-[1920px] overflow-visible px-3 py-3 sm:px-5">
            <div className="flex items-center gap-1.5 overflow-visible rounded-2xl border border-zinc-200/80 bg-white p-1.5 shadow-sm shadow-zinc-900/[0.03] dark:border-zinc-800 dark:bg-zinc-950 sm:gap-2 sm:p-2">
              <div
                role="tablist"
                aria-label="Gallery sections"
                className="flex min-w-0 flex-1 gap-0.5 rounded-xl bg-zinc-100/80 p-0.5 dark:bg-zinc-900 sm:gap-1 sm:p-1"
              >
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
                        ? selectedCount
                        : editedCount;
                  const active = photoTab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setPhotoTab(key)}
                      className={cn(
                        "inline-flex min-h-[36px] min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[11px] font-medium transition sm:min-h-[38px] sm:flex-none sm:gap-1.5 sm:px-3.5 sm:text-sm",
                        active
                          ? "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700"
                          : "text-zinc-600 hover:bg-white/70 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-white",
                      )}
                    >
                      <span className="truncate">{label}</span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums sm:px-2 sm:py-0.5 sm:text-[11px]",
                          active
                            ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                            : "bg-white text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400",
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {isPhotoGridTab ? (
                <div ref={layoutMenuRef} className="relative z-50 shrink-0">
                  <button
                    ref={layoutMenuButtonRef}
                    type="button"
                    onClick={() => setLayoutMenuOpen((open) => !open)}
                    aria-expanded={layoutMenuOpen}
                    aria-haspopup="menu"
                    aria-label="Change gallery layout"
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100/80 text-zinc-700 transition hover:bg-white hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white sm:h-[38px] sm:w-[38px] sm:rounded-xl",
                      layoutMenuOpen &&
                        "bg-white text-zinc-950 ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700",
                    )}
                  >
                    <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                  </button>
                  {layoutMenuOpen && layoutMenuPosition && typeof document !== "undefined"
                    ? createPortal(
                        <div
                          ref={layoutMenuPanelRef}
                          role="menu"
                          aria-label="Gallery layout options"
                          style={{
                            position: "fixed",
                            top: layoutMenuPosition.top,
                            right: layoutMenuPosition.right,
                          }}
                          className="z-[200] min-w-[12.5rem] overflow-hidden rounded-xl border border-zinc-200/90 bg-white py-1 shadow-lg shadow-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40"
                        >
                          {GRID_LAYOUTS.map(({ id, label, shortLabel, icon: Icon }) => {
                            const active = gridLayout === id;
                            return (
                              <button
                                key={id}
                                type="button"
                                role="menuitemradio"
                                aria-checked={active}
                                onClick={() => {
                                  setGridLayout(id);
                                  setLayoutMenuOpen(false);
                                }}
                                className={cn(
                                  "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition",
                                  active
                                    ? "bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-100"
                                    : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800",
                                )}
                              >
                                <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                                <span className="min-w-0 flex-1">
                                  <span className="block font-medium leading-tight">{shortLabel}</span>
                                  <span className="mt-0.5 block text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                                    {label}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>,
                        document.body,
                      )
                    : null}
                </div>
              ) : null}
            </div>

            {showGallerySets ? (
              <ClientGallerySetBar
                className="mt-2"
                sets={gallerySets}
                allSetsLabel={gallery?.setsAllLabel}
                allSetsSortOrder={gallery?.setsAllSortOrder}
                filter={setFilter}
                onFilterChange={setSetFilter}
                items={setBarCountItems}
              />
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1920px] bg-white px-4 py-8 pb-12 sm:px-5 dark:bg-zinc-950">
        {photoTab === "blog" && gallery ? (
          <LazyGalleryBlogClientSection
            folderId={gallery.folderId}
            publicKey={publicKey}
            assets={assets.map((a) => ({
              id: a.id,
              thumbUrl: a.thumbUrl,
              previewUrl: a.previewUrl,
              originalName: a.originalName,
            }))}
            onViewGallery={() => setPhotoTab("all")}
          />
        ) : photoTab === "edited" ? (
          visibleFinals.length === 0 ? (
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
              <ul key={`finals-${galleryGridKey}`} className={galleryListClass(gridLayout)}>
              {displayedFinals.map((f, index) => {
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
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imgSrc}
                            alt={f.name}
                            loading={index < 10 ? "eager" : "lazy"}
                            decoding="async"
                            draggable={!locked}
                            className={cn(
                              "absolute inset-0 h-full w-full cursor-zoom-in object-cover",
                              locked && "select-none",
                            )}
                            onContextMenu={(e) => {
                              if (locked) e.preventDefault();
                            }}
                          />
                        )}
                        {showUnlockedVideo ? <VideoTileOverlay /> : null}
                      </button>
                      {locked ? (
                        <div
                          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-3 text-center text-white"
                          aria-hidden
                        >
                          <Lock className="size-6 shrink-0 opacity-90" aria-hidden />
                          {f.outstandingBalanceGhs != null && f.outstandingBalanceGhs > 0 ? (
                            <p className="mt-2 text-xs font-semibold tabular-nums">
                              Pay GHS {f.outstandingBalanceGhs.toFixed(2)} to download
                            </p>
                          ) : null}
                          <p className="mt-1 max-w-[14rem] text-[11px] leading-snug text-white/90">
                            Contact your photographer to unlock downloads
                          </p>
                        </div>
                      ) : null}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-end bg-gradient-to-t from-black/55 via-black/20 to-transparent p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <div className="pointer-events-auto flex items-center gap-1.5">
                        {locked ? (
                          <span
                            className={tileActionClass()}
                            title="Locked"
                          >
                            <Lock className="h-4 w-4" aria-hidden />
                          </span>
                        ) : (
                          <>
                            {finalsDownloadsAllowed ? (
                              preferInlineFinalSave ? (
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
                                  className={tileActionClass()}
                                >
                                  {finalSaveBusyId === f.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                  ) : (
                                    <Download className="h-4 w-4" aria-hidden />
                                  )}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={finalSaveBusyId !== null}
                                  aria-busy={finalSaveBusyId === f.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleDownloadFinalDesktop(f);
                                  }}
                                  className={tileActionClass()}
                                  aria-label={`Download ${f.name}`}
                                >
                                  {finalSaveBusyId === f.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                  ) : (
                                    <Download className="h-4 w-4" aria-hidden />
                                  )}
                                </button>
                              )
                            ) : null}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openFinalFeedback(f);
                              }}
                              className={tileActionClass()}
                              aria-label={
                                f.flaggedByClient
                                  ? `View feedback for ${f.name}`
                                  : `Flag ${f.name} for review`
                              }
                            >
                              <Flag
                                className={cn(
                                  "h-4 w-4",
                                  f.flaggedByClient && "fill-white",
                                )}
                                aria-hidden
                              />
                            </button>
                          </>
                        )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
              {hasMoreFinals ? (
                <GalleryViewMoreButton
                  onClick={loadMoreGalleryMedia}
                  remainingCount={remainingFinalsCount}
                />
              ) : null}
            </>
          )
        ) : visibleAssets.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            {photoTab === "selected"
              ? "You have not selected any media yet."
              : "No media in this gallery yet."}
          </p>
        ) : uploadSections ? (
          <div className="space-y-10">
            {uploadSections.map((section, sectionIndex) => {
              const indexOffset = uploadSections
                .slice(0, sectionIndex)
                .reduce((sum, s) => sum + s.assets.length, 0);
              return (
                <section key={section.id}>
                  <h2
                    className="mb-4 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
                    style={{ fontFamily: bodyFamily }}
                  >
                    {section.title}
                  </h2>
                  <ClientGalleryAssetGrid
                    key={`${galleryGridKey}-${section.id}`}
                    assets={section.assets}
                    gridLayout={gridLayout}
                    previewWatermarkEnabled={previewWatermarkEnabled}
                    previewWatermarkLabel={previewWatermarkLabel}
                    rightsProtection={gallery.rightsProtection}
                    editingLocked={editingLocked}
                    syncBusy={syncBusy}
                    onOpen={openLb}
                    onToggleSelect={toggleSelect}
                    onOpenComment={openPhotoComment}
                    indexOffset={indexOffset}
                  />
                </section>
              );
            })}
          </div>
        ) : (
          <>
          <ClientGalleryAssetGrid
            key={galleryGridKey}
            assets={displayedAssets}
            gridLayout={gridLayout}
            previewWatermarkEnabled={previewWatermarkEnabled}
            previewWatermarkLabel={previewWatermarkLabel}
            rightsProtection={gallery.rightsProtection}
            editingLocked={editingLocked}
            syncBusy={syncBusy}
            onOpen={openLb}
            onToggleSelect={toggleSelect}
            onOpenComment={openPhotoComment}
          />
          {hasMoreAssets ? (
            <GalleryViewMoreButton
              onClick={loadMoreGalleryMedia}
              remainingCount={remainingAssetsCount}
            />
          ) : null}
          </>
        )}
      </main>

      <footer className="border-t border-zinc-200/80 bg-white px-4 py-8 pb-[max(env(safe-area-inset-bottom),2rem)] text-center dark:border-zinc-800 dark:bg-zinc-950 sm:px-5">
        <a
          href={MARKETING_SITE_ORIGIN}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${APP_NAME}`}
          className="inline-block rounded-sm opacity-90 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        >
          <Image
            src="/svgs/color_logo.svg"
            alt={APP_NAME}
            width={72}
            height={78}
            className="mx-auto h-10 w-auto object-contain sm:h-11"
          />
        </a>
      </footer>

      {lightboxId && lbAsset ? (
        <LazyMediaLightbox
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
              <div className="flex flex-wrap items-center justify-center gap-2">
                {(lbAssetHasComment || !editingLocked) ? (
                  <button
                    type="button"
                    onClick={() => openPhotoComment(lbAsset)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition",
                      lbAssetHasComment
                        ? "bg-sky-500 text-white shadow-lg shadow-sky-900/30"
                        : "border border-white/25 bg-white/10 text-white hover:bg-white/15",
                    )}
                  >
                    <MessageCircle
                      className={cn(
                        "size-4 stroke-[1.5]",
                        lbAssetHasComment && "fill-white",
                      )}
                      aria-hidden
                    />
                    {editingLocked
                      ? "View note"
                      : lbAssetHasComment
                        ? "View note"
                        : "Add note"}
                  </button>
                ) : null}
                {!editingLocked ? (
                  <button
                    type="button"
                    disabled={syncBusy}
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
                ) : null}
              </div>
            </div>
          }
        >
          {lbAssetIsVideo ? (
            <video
              src={clientGalleryLightboxSrc(lbAsset, previewWatermarkEnabled)}
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
            <div className="relative inline-block max-h-full max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={clientGalleryLightboxSrc(lbAsset, previewWatermarkEnabled)}
                alt={lbAsset.originalName}
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
              {shouldShowClientPreviewWatermarkOverlay(
                lbAsset,
                previewWatermarkEnabled,
                false,
              ) ? (
                <ClientPreviewWatermarkOverlay text={previewWatermarkLabel} />
              ) : null}
            </div>
          )}
        </LazyMediaLightbox>
      ) : null}

      {finalLb ? (
        <LazyMediaLightbox
          open
          onClose={closeAllPreviews}
          ariaLabel={`Preview — ${finalLb.name}`}
          mediaKey={finalLb.id}
          title={finalLb.name}
          subtitle={
            finalLb.locked
              ? finalLb.outstandingBalanceGhs != null && finalLb.outstandingBalanceGhs > 0
                ? `GHS ${finalLb.outstandingBalanceGhs.toFixed(2)} outstanding — preview only`
                : "Preview only until paid"
              : undefined
          }
          counter={
            visibleFinals.length > 1
              ? { current: finalLbIndex + 1, total: visibleFinals.length }
              : undefined
          }
          canPrevious={finalLbIndex > 0}
          canNext={finalLbIndex >= 0 && finalLbIndex < visibleFinals.length - 1}
          onPrevious={() => {
            const prev = visibleFinals[finalLbIndex - 1];
            if (prev) {
              setFinalLightboxId(prev.id);
              setZoom(1);
            }
          }}
          onNext={() => {
            const next = visibleFinals[finalLbIndex + 1];
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
                <span className="inline-flex flex-col items-center gap-1 text-center text-xs text-amber-200">
                  <span className="inline-flex items-center gap-1.5">
                    <Lock className="size-3.5 shrink-0" aria-hidden />
                    {finalLb.outstandingBalanceGhs != null && finalLb.outstandingBalanceGhs > 0
                      ? `Pay GHS ${finalLb.outstandingBalanceGhs.toFixed(2)} to download`
                      : "Preview only until paid"}
                  </span>
                  <span className="text-[11px] text-amber-100/80">
                    Contact your photographer to unlock downloads
                  </span>
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openFinalFeedback(finalLb)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition",
                      finalLb.flaggedByClient
                        ? "bg-amber-500 text-white hover:bg-amber-400"
                        : "border border-white/25 bg-white/10 text-white hover:bg-white/15",
                    )}
                  >
                    <Flag
                      className={cn(
                        "size-4 shrink-0",
                        finalLb.flaggedByClient && "fill-white",
                      )}
                      aria-hidden
                    />
                    {finalLb.flaggedByClient ? "View feedback" : "Flag for review"}
                  </button>
                  {finalsDownloadsAllowed ? (
                    preferInlineFinalSave ? (
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
                      <button
                        type="button"
                        disabled={finalSaveBusyId !== null}
                        aria-busy={finalSaveBusyId === finalLb.id}
                        onClick={() => void handleDownloadFinalDesktop(finalLb)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-900 enabled:hover:bg-white/90 disabled:opacity-50"
                      >
                        {finalSaveBusyId === finalLb.id ? (
                          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                        ) : (
                          <Download className="size-4 shrink-0" aria-hidden />
                        )}
                        Download
                      </button>
                    )
                  ) : null}
                </>
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
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={finalDisplaySrc(finalLb, publicKey)}
              alt={finalLb.name}
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
        </LazyMediaLightbox>
      ) : null}

      {photoComment ? (
        <div className="fixed inset-0 z-[64] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Close note"
            onClick={() => {
              if (!photoCommentBusy) setPhotoComment(null);
            }}
          />
          <div
            className="relative z-10 flex max-h-[min(88dvh,640px)] w-full flex-col rounded-t-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-md sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={`Photo note: ${photoComment.photoName}`}
          >
            <div className="shrink-0 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {photoComment.readOnly || !photoComment.editing
                  ? photoComment.savedComment.trim()
                    ? "Your note"
                    : "Photo note"
                  : photoComment.savedComment.trim()
                    ? "Edit note"
                    : "Add a note"}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {photoComment.readOnly || !photoComment.editing
                  ? photoComment.photoName
                  : `Leave feedback for your photographer about ${photoComment.photoName}.`}
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {photoComment.readOnly || !photoComment.editing ? (
                <div className="space-y-3">
                  {photoComment.savedComment.trim() ? (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900/50">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Your note
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
                        {photoComment.savedComment}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No note on this photo yet.
                    </p>
                  )}
                  {photoComment.photographerReply ? (
                    <div className="rounded-xl border border-brand/15 bg-brand-soft/60 px-3 py-2.5 dark:border-brand/25 dark:bg-brand/10">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-ink dark:text-brand-on-dark">
                        Photographer reply
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
                        {photoComment.photographerReply}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  {photoComment.photographerReply ? (
                    <div className="mb-4 rounded-xl border border-brand/15 bg-brand-soft/60 px-3 py-2.5 dark:border-brand/25 dark:bg-brand/10">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-ink dark:text-brand-on-dark">
                        Photographer reply
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
                        {photoComment.photographerReply}
                      </p>
                    </div>
                  ) : null}
                  <FormTextArea
                    value={photoComment.comment}
                    onChange={(e) =>
                      setPhotoComment((current) =>
                        current ? { ...current, comment: e.target.value } : current,
                      )
                    }
                    rows={4}
                    placeholder="Example: Please crop tighter on this one."
                    className="[&_.ant-input]:!resize-none [&_.ant-input]:!rounded-xl"
                  />
                </>
              )}
            </div>
            <div className="shrink-0 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={photoCommentBusy}
                  onClick={() => {
                    if (photoComment.editing && !photoComment.readOnly) {
                      closePhotoCommentEdit();
                    } else {
                      setPhotoComment(null);
                    }
                  }}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200"
                >
                  {photoComment.editing && !photoComment.readOnly ? "Cancel" : "Close"}
                </button>
                {photoComment.readOnly ? null : photoComment.editing ? (
                  <button
                    type="button"
                    disabled={photoCommentBusy || photoComment.comment.trim().length === 0}
                    onClick={() => void submitPhotoComment()}
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    {photoCommentBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <MessageCircle className="h-4 w-4" aria-hidden />
                    )}
                    Save note
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoComment((current) =>
                        current ? { ...current, editing: true } : current,
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    {photoComment.savedComment.trim() ? "Edit note" : "Add note"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {finalFeedback ? (
        <div className="fixed inset-0 z-[64] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Close feedback"
            onClick={() => {
              if (!finalFeedbackBusy) setFinalFeedback(null);
            }}
          />
          <div
            className="relative z-10 flex max-h-[min(88dvh,640px)] w-full flex-col rounded-t-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-md sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={`Flag final: ${finalFeedback.finalName}`}
          >
            <div className="shrink-0 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {!finalFeedback.editing
                  ? "Feedback"
                  : finalFeedback.flaggedByClient
                    ? "Update feedback"
                    : "Flag this final"}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {!finalFeedback.editing
                  ? finalFeedback.finalName
                  : `Tell your photographer what should be adjusted for ${finalFeedback.finalName}.`}
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {!finalFeedback.editing ? (
                <div className="space-y-3">
                  {finalFeedback.savedComment.trim() ? (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900/50">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Your feedback
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
                        {finalFeedback.savedComment}
                      </p>
                    </div>
                  ) : null}
                  {finalFeedback.photographerReply ? (
                    <div className="rounded-xl border border-brand/15 bg-brand-soft/60 px-3 py-2.5 dark:border-brand/25 dark:bg-brand/10">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-ink dark:text-brand-on-dark">
                        Photographer reply
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
                        {finalFeedback.photographerReply}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  {finalFeedback.photographerReply ? (
                    <div className="mb-4 rounded-xl border border-brand/15 bg-brand-soft/60 px-3 py-2.5 dark:border-brand/25 dark:bg-brand/10">
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
                    className="[&_.ant-input]:!resize-none [&_.ant-input]:!rounded-xl"
                  />
                </>
              )}
            </div>
            <div className="shrink-0 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={finalFeedbackBusy}
                  onClick={() => {
                    if (finalFeedback.editing) {
                      closeFinalFeedbackEdit();
                    } else {
                      setFinalFeedback(null);
                    }
                  }}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200"
                >
                  {finalFeedback.editing ? "Cancel" : "Close"}
                </button>
                {finalFeedback.editing ? (
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
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setFinalFeedback((current) =>
                        current ? { ...current, editing: true } : current,
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    <Flag className="h-4 w-4" aria-hidden />
                    Edit feedback
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {coverLightboxOpen && gallery.coverImageUrl ? (
        <LazyMediaLightbox
          open
          onClose={closeAllPreviews}
          ariaLabel="Cover preview"
          mediaKey={gallery.coverImageUrl}
          title={displayTitle ? `Cover — ${displayTitle}` : "Gallery cover"}
          zoom={zoom}
          onZoomChange={setZoom}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gallery.coverImageUrl}
            alt={displayTitle ? `Cover — ${displayTitle}` : "Gallery cover"}
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
        </LazyMediaLightbox>
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
          {galleryMusicStarted || galleryMusicMuted ? (
            <div className="fixed bottom-4 right-4 z-[52] sm:bottom-6 sm:right-6">
              <button
                type="button"
                onClick={toggleGalleryMusic}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200/90 bg-white/95 text-zinc-900 shadow-lg backdrop-blur-sm transition hover:bg-white dark:border-zinc-600 dark:bg-zinc-900/95 dark:text-zinc-50 dark:hover:bg-zinc-900"
                aria-label={
                  galleryMusicMuted ? "Unmute gallery music" : "Mute gallery music"
                }
              >
                {galleryMusicMuted ? (
                  <VolumeX className="h-5 w-5" aria-hidden />
                ) : (
                  <Volume2 className="h-5 w-5" aria-hidden />
                )}
              </button>
            </div>
          ) : null}
        </>
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