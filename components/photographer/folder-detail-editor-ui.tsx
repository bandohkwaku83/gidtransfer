"use client";

import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Eye,
  ExternalLink,
  // FileText,
  Focus,
  ImageIcon,
  ImagePlus,
  KeyRound,
  LayoutGrid,
  Link2,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Monitor,
  Pencil,
  Music2,
  Palette,
  RefreshCw,
  Send,
  Shield,
  Smartphone,
  Trash2,
  Upload,
} from "lucide-react";
import { Dropdown, Select, type MenuProps } from "antd";
import { CoverFocalPreview } from "@/components/photographer/cover-focal-preview";
import { GalleryCoverHeroPreview } from "@/components/client/gallery-cover-hero-preview";
import {
  GALLERY_COVER_FRAMES,
  normalizeGalleryCoverFrame,
  type GalleryCoverFrame,
} from "@/lib/gallery-cover-frame";
import { CoverFrameThumb } from "@/components/photographer/cover-frame-thumb";
import {
  coverFrameThumbShellClass,
  coverFrameThumbShellStyle,
} from "@/lib/gallery-cover-frame-preview";
import {
  coverColorsMatch,
  GALLERY_COVER_ACCENT_PRESETS,
  GALLERY_COVER_COLOR_PRESETS,
  normalizeGalleryCoverColor,
  resolveGalleryCoverButtonColor,
  resolveGalleryCoverTextColor,
  type GalleryCoverColorPreset,
} from "@/lib/gallery-cover-color";
import type { FolderStatus } from "@/lib/demo-data";
import {
  GALLERY_IMAGE_LAYOUTS,
  type GalleryImageLayout,
  type GalleryImageLayoutOption,
  previewGridClass,
  previewTileClass,
} from "@/lib/gallery-image-layout";
import { galleryFontStack, useGalleryGoogleFonts } from "@/lib/gallery-typography";
import type { GalleryCoverFrameOption } from "@/lib/gallery-cover-frame";
import { FormInput, FormTextArea } from "@/components/ui/form-input";
import { galleryAccessPinDigits } from "@/lib/gallery-access-pin";
import { cn } from "@/lib/utils";
import {
  buildGalleryShareMessage,
  buildMailtoShareUrl,
  buildWhatsAppShareUrl,
} from "@/lib/gallery-share-links";
import { statusLabel } from "@/components/photographer/folder-detail-bits";
import type { GalleryAccessEmailEntry } from "@/lib/gallery-email-access";

export type FolderEditorTab = "dashboard" | "gallery" | "uploads" | "selection" | "finals" | "blog";
export type PreviewLayout = GalleryImageLayout;
export type PreviewViewport = "desktop" | "mobile";

function CustomizeSection({
  icon: Icon,
  title,
  description,
  children,
  footer,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand dark:bg-brand/15 dark:text-brand-on-dark">
            <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="space-y-3 p-4">{children}</div>
      {footer ? (
        <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">{footer}</div>
      ) : null}
    </section>
  );
}

function FontSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (font: string) => void;
}) {
  const fallback = label === "Title font" ? "serif" : "sans-serif";

  return (
    <label className="block">
      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      <Select
        value={value}
        onChange={onChange}
        options={options.map((f) => ({ value: f, label: f }))}
        className="mt-1.5 w-full [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-zinc-200 [&_.ant-select-selector]:!bg-white [&_.ant-select-selector]:!py-1 dark:[&_.ant-select-selector]:!border-zinc-700 dark:[&_.ant-select-selector]:!bg-zinc-900"
        popupMatchSelectWidth
        optionRender={(option) => (
          <span
            style={{
              fontFamily:
                galleryFontStack(String(option.value), fallback) ?? `"${String(option.value)}", ${fallback}`,
            }}
          >
            {option.label}
          </span>
        )}
        labelRender={(option) => (
          <span
            style={{
              fontFamily:
                galleryFontStack(String(option.value), fallback) ?? `"${String(option.value)}", ${fallback}`,
            }}
          >
            {option.label}
          </span>
        )}
      />
    </label>
  );
}

function statusBadgeLight(s: FolderStatus): string {
  switch (s) {
    case "COMPLETED":
      return "text-emerald-700 dark:text-emerald-300";
    case "SELECTION_PENDING":
      return "text-amber-800 dark:text-amber-200";
    default:
      return "text-zinc-500 dark:text-zinc-400";
  }
}

export function GalleryAccessPinDisplay({
  pin,
  className,
}: {
  pin: string;
  className?: string;
}) {
  const digits = galleryAccessPinDigits(pin);
  return (
    <div
      className={cn("flex justify-center gap-1.5", className)}
      role="group"
      aria-label={`Gallery access code ${digits.join("")}`}
    >
      {digits.map((digit, index) => (
        <span
          key={index}
          className="flex h-9 w-8 items-center justify-center rounded-lg border border-zinc-200/90 bg-white font-mono text-base font-semibold tabular-nums text-zinc-900 shadow-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
        >
          {digit}
        </span>
      ))}
    </div>
  );
}

function GalleryAccessPinPanel({
  pin,
  pinCopied,
  busy,
  onCopy,
  onRegenerate,
}: {
  pin: string;
  pinCopied: boolean;
  busy?: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
}) {
  return (
    <div className="mt-3 rounded-xl border border-brand/20 bg-brand-soft/40 p-3.5 dark:border-brand/30 dark:bg-brand/10">
      <div className="flex items-start gap-2">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-brand dark:text-brand-on-dark" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">Gallery access code</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Clients enter this 4-digit code before viewing photos. Share it separately from the link.
          </p>
        </div>
      </div>
      <GalleryAccessPinDisplay pin={pin} className="mt-4" />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onCopy}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[11px] font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-45 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          {pinCopied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
          {pinCopied ? "Copied" : "Copy code"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onRegenerate}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[11px] font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-45 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          New code
        </button>
      </div>
      <p className="mt-2.5 text-[10px] text-zinc-500 dark:text-zinc-400">
        Regenerating invalidates the previous code for anyone who already had it.
      </p>
    </div>
  );
}

function GalleryAccessEmailList({ entries }: { entries: GalleryAccessEmailEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="mt-3 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        No emails recorded yet. When clients open the gallery, their addresses appear here.
      </p>
    );
  }

  return (
    <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {entries.map((entry) => (
          <li
            key={`${entry.email}-${entry.accessedAt}`}
            className="flex items-start justify-between gap-3 px-3 py-2.5"
          >
            <span className="min-w-0 truncate text-xs font-medium text-zinc-800 dark:text-zinc-100">
              {entry.email}
            </span>
            <time
              dateTime={entry.accessedAt}
              className="shrink-0 text-[10px] tabular-nums text-zinc-500 dark:text-zinc-400"
            >
              {new Date(entry.accessedAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-45",
        checked ? "bg-brand" : "bg-zinc-300 dark:bg-zinc-600",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

export function FolderEditorChrome({
  title,
  eventDateLabel,
  clientName,
  folderStatus,
  busy,
  shareActive,
  shareUrl,
  linkCopied,
  onMarkCompleted,
  onEdit,
  onMoveToTrash,
  onCopyShare,
  onRegenerateLink,
}: {
  title: string;
  eventDateLabel: string;
  clientName: string;
  folderStatus: FolderStatus;
  busy: boolean;
  shareActive: boolean;
  shareUrl: string;
  linkCopied?: boolean;
  onMarkCompleted: () => void;
  onEdit?: () => void;
  onMoveToTrash?: () => void;
  onCopyShare?: () => void;
  onRegenerateLink?: () => void;
}) {
  const client = clientName.trim();

  const shareMessage = useMemo(
    () => (shareActive && shareUrl ? buildGalleryShareMessage(title, shareUrl, client) : ""),
    [shareActive, shareUrl, title, client],
  );

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const shareMenuItems = useMemo<MenuProps["items"]>(() => {
    const items: NonNullable<MenuProps["items"]> = [
      {
        key: "copy",
        label: linkCopied ? "Copied to clipboard" : "Copy client link",
        icon: linkCopied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden />
        ),
        disabled: !shareActive,
      },
      { type: "divider" },
      {
        key: "email",
        label: "Share by email",
        icon: <Mail className="h-3.5 w-3.5" aria-hidden />,
        disabled: !shareActive,
      },
      {
        key: "whatsapp",
        label: "Share by WhatsApp",
        icon: <MessageCircle className="h-3.5 w-3.5" aria-hidden />,
        disabled: !shareActive,
      },
    ];
    if (canNativeShare) {
      items.push({
        key: "native",
        label: "Share from device",
        icon: <Send className="h-3.5 w-3.5" aria-hidden />,
        disabled: !shareActive,
      });
    }
    items.push(
      { type: "divider" },
      {
        key: "regenerate",
        label: "Regenerate link",
        icon: <RefreshCw className="h-3.5 w-3.5" aria-hidden />,
        disabled: busy,
      },
    );
    return items;
  }, [shareActive, linkCopied, busy, canNativeShare]);

  const moreMenuItems = useMemo<MenuProps["items"]>(() => {
    const items: NonNullable<MenuProps["items"]> = [
      {
        key: "copy",
        label: linkCopied ? "Copied to clipboard" : "Copy client link",
        icon: linkCopied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden />
        ),
        disabled: !shareActive,
      },
      {
        key: "edit",
        label: "Edit gallery details",
        icon: <Pencil className="h-3.5 w-3.5" aria-hidden />,
        disabled: busy || !onEdit,
      },
      {
        key: "complete",
        label: "Mark as completed",
        icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />,
        disabled: busy || folderStatus === "COMPLETED",
      },
      {
        key: "regenerate",
        label: "Regenerate client link",
        icon: <RefreshCw className="h-3.5 w-3.5" aria-hidden />,
        disabled: busy,
      },
      {
        key: "trash",
        label: "Move to trash",
        icon: <Trash2 className="h-3.5 w-3.5" aria-hidden />,
        danger: true,
        disabled: busy || !onMoveToTrash,
      },
    ];
    return items;
  }, [busy, shareActive, linkCopied, folderStatus, onEdit, onMoveToTrash]);

  const handleMoreMenuClick = ({ key }: { key: string }) => {
    if (key === "copy") {
      onCopyShare?.();
      return;
    }
    if (key === "edit") {
      onEdit?.();
      return;
    }
    if (key === "complete") {
      onMarkCompleted();
      return;
    }
    if (key === "regenerate") {
      onRegenerateLink?.();
      return;
    }
    if (key === "trash") {
      onMoveToTrash?.();
    }
  };

  const outlineActionClass =
    "inline-flex items-center gap-1.5 rounded-lg border border-[#55001F] bg-white px-3.5 py-2 text-[13px] font-medium text-zinc-900 shadow-sm transition hover:bg-[#55001F]/5 disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#55001F] dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-[#55001F]/10";

  const handleShareMenuClick = ({ key }: { key: string }) => {
    if (key === "copy") {
      onCopyShare?.();
      return;
    }
    if (key === "regenerate") {
      onRegenerateLink?.();
      return;
    }
    if (!shareActive || !shareUrl || !shareMessage) return;

    if (key === "email") {
      const subject = `Gallery: ${title.trim() || "Your photos"}`;
      window.location.href = buildMailtoShareUrl({ subject, body: shareMessage });
      return;
    }
    if (key === "whatsapp") {
      window.open(buildWhatsAppShareUrl(shareMessage), "_blank", "noopener,noreferrer");
      return;
    }
    if (key === "native" && canNativeShare) {
      void navigator.share({
        title: title.trim() || "Gallery",
        text: shareMessage,
        url: shareUrl,
      });
    }
  };

  return (
    <header>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
        <Link
          href="/dashboard/galleries"
          className="inline-flex items-center gap-1 text-[13px] text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
          Galleries
        </Link>
        <div className="flex flex-wrap items-center gap-2.5">
          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            menu={{
              items: moreMenuItems,
              onClick: handleMoreMenuClick,
            }}
          >
            <button type="button" className={outlineActionClass}>
              More
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500" strokeWidth={2} aria-hidden />
            </button>
          </Dropdown>

          <button
            type="button"
            disabled={!shareActive || !shareUrl}
            title={shareActive && shareUrl ? undefined : "Share link not available yet"}
            onClick={() => {
              if (!shareActive || !shareUrl) return;
              window.open(shareUrl, "_blank", "noopener,noreferrer");
            }}
            className={outlineActionClass}
          >
            <Eye
              className={cn(
                "h-4 w-4",
                shareActive && shareUrl
                  ? "text-zinc-600 dark:text-zinc-400"
                  : "text-zinc-400",
              )}
              strokeWidth={1.75}
              aria-hidden
            />
            Live view
          </button>

          <div className="inline-flex overflow-hidden rounded-lg bg-brand text-white shadow-sm">
            <button
              type="button"
              disabled={!shareActive || busy}
              onClick={() => onCopyShare?.()}
              className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
              Share
            </button>
            <span className="w-px self-stretch bg-white/25" aria-hidden />
            <Dropdown
              trigger={["click"]}
              placement="bottomRight"
              disabled={!onCopyShare}
              menu={{
                items: shareMenuItems,
                onClick: handleShareMenuClick,
              }}
            >
              <button
                type="button"
                className="inline-flex h-full items-center justify-center px-3 py-2 transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Share options"
              >
                <ChevronDown className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              </button>
            </Dropdown>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-4">
        <div className="min-w-0">
          <h1 className="truncate text-[1.35rem] font-medium leading-snug tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
          {client || eventDateLabel ? (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-zinc-500 dark:text-zinc-400">
              {client ? <span>{client}</span> : null}
              {client && eventDateLabel ? (
                <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>
                  ·
                </span>
              ) : null}
              {eventDateLabel ? (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                  {eventDateLabel}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 text-[12px] font-medium tracking-wide",
            statusBadgeLight(folderStatus),
          )}
        >
          {statusLabel(folderStatus)}
        </span>
      </div>
    </header>
  );
}

export function FolderEditorTabBar({
  tab,
  onTabChange,
  counts,
  showPreviewToggle,
  previewViewport,
  onPreviewViewportChange,
}: {
  tab: FolderEditorTab;
  onTabChange: (tab: FolderEditorTab) => void;
  counts: { uploads: number; selection: number; finals: number; blog?: number };
  showPreviewToggle: boolean;
  previewViewport: PreviewViewport;
  onPreviewViewportChange: (v: PreviewViewport) => void;
}) {
  const items: {
    key: FolderEditorTab;
    label: string;
    shortLabel: string;
    icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  }[] = [
    { key: "dashboard", label: "Gallery dashboard", shortLabel: "Dashboard", icon: LayoutGrid },
    { key: "gallery", label: "Design", shortLabel: "Design", icon: Palette },
    { key: "uploads", label: "Upload raw", shortLabel: "Upload raw", icon: Upload },
    { key: "selection", label: "Client selection", shortLabel: "Selection", icon: CheckCircle2 },
    { key: "finals", label: "Final images", shortLabel: "Finals", icon: ImageIcon },
    // { key: "blog", label: "Blog", shortLabel: "Blog", icon: FileText },
  ];

  function tabClass(active: boolean) {
    return cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition sm:px-3",
      active
        ? "bg-brand text-white"
        : "text-zinc-600 hover:bg-white hover:text-zinc-900",
    );
  }

  function previewClass(active: boolean) {
    return cn(
      "inline-flex h-8 w-9 items-center justify-center rounded-md transition",
      active
        ? "bg-brand text-white"
        : "text-zinc-500 hover:bg-white hover:text-zinc-800",
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand/10 bg-[#F1EBF0] px-2 py-1.5 sm:px-2.5">
      <div className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          role="tablist"
          aria-label="Gallery workspace"
          className="inline-flex gap-0.5 rounded-lg bg-[#f5f5f5] p-0.5"
        >
          {items.map(({ key, label, shortLabel, icon: Icon }) => {
            const active = tab === key;
            const count =
              key === "uploads"
                ? counts.uploads
                : key === "selection"
                  ? counts.selection
                  : key === "finals"
                    ? counts.finals
                    : key === "blog"
                      ? counts.blog
                      : null;

            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                title={label}
                onClick={() => onTabChange(key)}
                className={tabClass(active)}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
                {count != null && count > 0 ? (
                  <span
                    className={cn(
                      "inline-flex min-w-[1.15rem] items-center justify-center rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums leading-none",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-zinc-200/80 text-zinc-600",
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {showPreviewToggle ? (
        <div
          className="inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-[#f5f5f5] p-0.5"
          role="group"
          aria-label="Preview viewport"
        >
          <button
            type="button"
            aria-pressed={previewViewport === "desktop"}
            onClick={() => onPreviewViewportChange("desktop")}
            className={previewClass(previewViewport === "desktop")}
            aria-label="Desktop preview"
          >
            <Monitor className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            aria-pressed={previewViewport === "mobile"}
            onClick={() => onPreviewViewportChange("mobile")}
            className={previewClass(previewViewport === "mobile")}
            aria-label="Mobile preview"
          >
            <Smartphone className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function GalleryLayoutPreview({
  layout,
  count,
}: {
  layout: GalleryImageLayout;
  count: number;
}) {
  return (
    <div
      className={cn(
        previewGridClass(layout),
        layout === "horizontal-scroll" && "scrollbar-thin",
      )}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={previewTileClass(layout, i)}>
          <div className="flex h-full min-h-12 items-center justify-center text-zinc-300 dark:text-zinc-600">
            <ImageIcon className="h-7 w-7" strokeWidth={1.25} aria-hidden />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CoverColorPicker({
  value,
  onChange,
  className,
  disabled,
  colorPresets = GALLERY_COVER_COLOR_PRESETS,
  label = "Backdrop color",
  hint,
}: {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
  disabled?: boolean;
  colorPresets?: readonly GalleryCoverColorPreset[];
  label?: string;
  hint?: string;
}) {
  const normalized = normalizeGalleryCoverColor(value);

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {colorPresets.map(({ id, hex, label }) => {
          const selected = coverColorsMatch(normalized, hex);
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              title={label}
              aria-label={`${label} (${hex})`}
              aria-pressed={selected}
              onClick={() => onChange(hex)}
              className={cn(
                "h-7 w-7 rounded-full border-2 transition disabled:opacity-50",
                selected
                  ? "border-brand ring-2 ring-brand/30"
                  : "border-white/80 shadow-sm ring-1 ring-zinc-900/10 dark:border-zinc-700 dark:ring-white/10",
              )}
              style={{ backgroundColor: hex }}
            />
          );
        })}
        <label
          className={cn(
            "relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-zinc-300 bg-white text-[9px] font-bold uppercase text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
            disabled && "pointer-events-none opacity-50",
          )}
          title="Custom color"
        >
          <span aria-hidden>#</span>
          <input
            type="color"
            value={normalized}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Custom backdrop color"
          />
        </label>
      </div>
      {hint ? (
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{hint}</p>
      ) : label === "Backdrop color" ? (
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
          Used on cinematic, collage, bento, carousel, and other framed cover styles.
        </p>
      ) : null}
    </div>
  );
}

export function CoverFrameStylePicker({
  value,
  onChange,
  coverColor,
  className,
  disabled,
  coverFrames = GALLERY_COVER_FRAMES,
}: {
  value: GalleryCoverFrame;
  onChange: (frame: GalleryCoverFrame) => void;
  coverColor?: string;
  className?: string;
  disabled?: boolean;
  coverFrames?: readonly GalleryCoverFrameOption[];
}) {
  return (
    <div
      className={cn(
        "grid max-h-[min(360px,55vh)] grid-cols-1 gap-1.5 overflow-y-auto pr-0.5 [scrollbar-width:thin] sm:grid-cols-2",
        className,
      )}
      role="listbox"
      aria-label="Cover image style"
    >
      {coverFrames.map(({ id, label, shortLabel, description }) => {
        const frameId = normalizeGalleryCoverFrame(id);
        const selected = value === frameId;
        return (
          <button
            key={id}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={`${label}. ${description}`}
            title={`${label} — ${description}`}
            disabled={disabled}
            onClick={() => onChange(frameId)}
            className={cn(
              "flex flex-col items-stretch rounded-xl border p-2 transition disabled:opacity-50",
              selected
                ? "border-brand/50 bg-brand-soft dark:border-brand/35 dark:bg-brand/15"
                : "border-zinc-200/90 bg-zinc-50/50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/30 dark:hover:border-zinc-600",
            )}
          >
            <div
              className={cn("w-full", coverFrameThumbShellClass(frameId, selected, coverColor))}
              style={coverFrameThumbShellStyle(frameId, coverColor)}
            >
              <CoverFrameThumb frame={frameId} />
            </div>
            <span
              className={cn(
                "mt-1.5 w-full truncate px-0.5 text-center text-[10px] font-semibold leading-tight",
                selected ? "text-brand dark:text-brand-on-dark" : "text-zinc-700 dark:text-zinc-300",
              )}
            >
              {shortLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function GalleryLayoutStylePicker({
  value,
  onChange,
  className,
  disabled,
  gridLayouts = GALLERY_IMAGE_LAYOUTS,
}: {
  value: GalleryImageLayout;
  onChange: (layout: GalleryImageLayout) => void;
  className?: string;
  disabled?: boolean;
  gridLayouts?: readonly GalleryImageLayoutOption[];
}) {
  return (
    <div
      className={cn(
        "grid max-h-[min(280px,50vh)] grid-cols-1 gap-1.5 overflow-y-auto pr-0.5 [scrollbar-width:thin] sm:grid-cols-2",
        className,
      )}
      role="listbox"
      aria-label="Image layout style"
    >
      {gridLayouts.map(({ id, label, description, icon: Icon }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={label}
            title={description}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition disabled:opacity-50",
              selected
                ? "border-brand/50 bg-brand-soft dark:border-brand/35 dark:bg-brand/15"
                : "border-zinc-200/90 bg-zinc-50/50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/30 dark:hover:border-zinc-600",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                selected ? "text-brand dark:text-brand-on-dark" : "text-zinc-400",
              )}
              strokeWidth={1.75}
              aria-hidden
            />
            <span
              className={cn(
                "min-w-0 truncate text-[11px] font-semibold leading-tight",
                selected ? "text-brand dark:text-brand-on-dark" : "text-zinc-800 dark:text-zinc-200",
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function GalleryClientPreview({
  coverSrc,
  hasCover,
  title,
  coverFrame,
  coverColor,
  coverTextColor,
  coverButtonColor,
  focalX,
  focalY,
  previewLayout,
  previewViewport,
  titleFont,
  bodyFont,
  placeholderCount = 12,
}: {
  coverSrc: string;
  hasCover: boolean;
  title: string;
  coverFrame: GalleryCoverFrame;
  coverColor?: string;
  coverTextColor?: string;
  coverButtonColor?: string;
  focalX: number;
  focalY: number;
  previewLayout: PreviewLayout;
  previewViewport: PreviewViewport;
  titleFont?: string;
  bodyFont?: string;
  placeholderCount?: number;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/5",
        previewViewport === "mobile" ? "max-w-[390px]" : "max-w-full",
      )}
    >
      <div className="border-b border-zinc-100 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Client preview
          <span className="mx-1.5 font-normal text-zinc-300 dark:text-zinc-600">·</span>
          {previewViewport === "mobile" ? "Mobile" : "Desktop"}
        </p>
      </div>
      <GalleryCoverHeroPreview
        coverSrc={coverSrc}
        hasCover={hasCover}
        title={title}
        coverFrame={coverFrame}
        coverColor={coverColor}
        coverTextColor={coverTextColor}
        coverButtonColor={coverButtonColor}
        focalX={focalX}
        focalY={focalY}
        titleFont={titleFont}
        bodyFont={bodyFont}
      />

      <div className="border-t border-zinc-100 p-4 sm:p-5 dark:border-zinc-800">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Photo grid
        </p>
        <GalleryLayoutPreview layout={previewLayout} count={placeholderCount} />
      </div>
    </div>
  );
}

export function CustomizeGallerySidebar({
  coverFrameDraft,
  onCoverFrameChange,
  coverColorDraft,
  onCoverColorChange,
  coverTextColorDraft,
  onCoverTextColorChange,
  coverButtonColorDraft,
  onCoverButtonColorChange,
  previewLayout,
  onPreviewLayoutChange,
  titleFont,
  bodyFont,
  onTitleFontChange,
  onBodyFontChange,
  coverFrameOptions = GALLERY_COVER_FRAMES,
  gridLayoutOptions = GALLERY_IMAGE_LAYOUTS,
  coverColorPresets = GALLERY_COVER_COLOR_PRESETS,
  titleFontOptions,
  bodyFontOptions,
  allowDownloads,
  onAllowDownloadsChange,
  musicEnabled,
  onMusicEnabledChange,
  musicBusy,
  hasMusic,
  passwordProtection,
  onPasswordProtectionChange,
  galleryAccessPin,
  accessPinCopied,
  onCopyAccessPin,
  onRegenerateAccessPin,
  accessPinBusy,
  emailGateEnabled,
  onEmailGateChange,
  galleryAccessEmails,
  emailGateBusy,
  coverBusy,
  hasCover,
  coverSrc,
  onReplaceCover,
  onAdjustFocal,
  focalEditOpen,
  focalX,
  focalY,
  onFocalChange,
  savingFocal,
  onSaveFocal,
  onCancelFocal,
  onUploadMusic,
  onRemoveMusic,
}: {
  coverFrameDraft: GalleryCoverFrame;
  onCoverFrameChange: (frame: GalleryCoverFrame) => void;
  coverColorDraft: string;
  onCoverColorChange: (hex: string) => void;
  coverTextColorDraft: string;
  onCoverTextColorChange: (hex: string) => void;
  coverButtonColorDraft: string;
  onCoverButtonColorChange: (hex: string) => void;
  previewLayout: PreviewLayout;
  onPreviewLayoutChange: (layout: PreviewLayout) => void;
  titleFont: string;
  bodyFont: string;
  onTitleFontChange: (font: string) => void;
  onBodyFontChange: (font: string) => void;
  coverFrameOptions?: readonly GalleryCoverFrameOption[];
  gridLayoutOptions?: readonly GalleryImageLayoutOption[];
  coverColorPresets?: readonly GalleryCoverColorPreset[];
  titleFontOptions?: readonly string[];
  bodyFontOptions?: readonly string[];
  allowDownloads: boolean;
  onAllowDownloadsChange: (v: boolean) => void;
  musicEnabled: boolean;
  onMusicEnabledChange: (v: boolean) => void;
  musicBusy: boolean;
  hasMusic: boolean;
  passwordProtection: boolean;
  onPasswordProtectionChange: (v: boolean) => void;
  galleryAccessPin: string;
  accessPinCopied: boolean;
  onCopyAccessPin: () => void;
  onRegenerateAccessPin: () => void;
  accessPinBusy?: boolean;
  emailGateEnabled: boolean;
  onEmailGateChange: (v: boolean) => void;
  galleryAccessEmails: GalleryAccessEmailEntry[];
  emailGateBusy?: boolean;
  coverBusy: boolean;
  hasCover: boolean;
  coverSrc: string;
  onReplaceCover: () => void;
  onAdjustFocal: () => void;
  focalEditOpen: boolean;
  focalX: number;
  focalY: number;
  onFocalChange: (x: number, y: number) => void;
  savingFocal: boolean;
  onSaveFocal: () => void;
  onCancelFocal: () => void;
  onUploadMusic: () => void;
  onRemoveMusic: () => void;
}) {
  useGalleryGoogleFonts(titleFont, bodyFont);

  return (
    <aside
      className={cn(
        "w-full shrink-0 space-y-4 lg:w-[min(100%,380px)]",
        "lg:sticky lg:top-4 lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto",
        "[scrollbar-width:thin]",
      )}
    >
      <div className="space-y-1 pr-0.5">
        <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Customize gallery
        </h2>
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Adjust how clients see this gallery. The preview on the left updates as you edit.
        </p>
      </div>

      <CustomizeSection
        icon={ImageIcon}
        title="Cover photo"
        description="Hero image and focal point. Saves immediately when you upload or adjust focal."
      >
        <div className="flex gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="relative h-[4.5rem] w-[6.5rem] shrink-0 overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800">
            {hasCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverSrc}
                alt=""
                className="h-full w-full object-cover"
                style={{ objectPosition: `${focalX}% ${focalY}%` }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-400">
                <ImageIcon className="h-6 w-6" strokeWidth={1.25} aria-hidden />
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
            <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
              {hasCover ? "Current cover" : "No cover yet"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={onReplaceCover}
                disabled={coverBusy}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-45 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                <ImagePlus className="h-3.5 w-3.5" aria-hidden />
                {coverBusy ? "Uploading…" : hasCover ? "Replace" : "Upload"}
              </button>
              <button
                type="button"
                onClick={onAdjustFocal}
                disabled={!hasCover}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition disabled:opacity-45",
                  focalEditOpen
                    ? "border-brand/40 bg-brand-soft text-brand dark:border-brand/35 dark:bg-brand/15 dark:text-brand-on-dark"
                    : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900",
                )}
              >
                <Focus className="h-3.5 w-3.5" aria-hidden />
                {focalEditOpen ? "Editing focal" : "Focal"}
              </button>
            </div>
          </div>
        </div>

        {focalEditOpen ? (
          <div className="space-y-3 rounded-xl border border-brand/20 bg-brand-soft/30 p-3 dark:border-brand/25 dark:bg-brand/10">
            <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
              Drag to set the focal point
            </p>
            <CoverFocalPreview
              imageUrl={coverSrc}
              focalX={focalX}
              focalY={focalY}
              onFocalChange={onFocalChange}
              disabled={savingFocal}
              frameClassName="aspect-[16/10] w-full rounded-lg"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={savingFocal}
                onClick={onSaveFocal}
                className="flex-1 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50"
              >
                {savingFocal ? "Saving…" : "Save focal"}
              </button>
              <button
                type="button"
                disabled={savingFocal}
                onClick={onCancelFocal}
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </CustomizeSection>

      <CustomizeSection
        icon={Palette}
        title="Cover style"
        description="Layout of the hero area on the client link. Changes save automatically."
      >
        <CoverColorPicker
          value={coverColorDraft}
          onChange={onCoverColorChange}
          colorPresets={coverColorPresets}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <CoverColorPicker
            value={coverTextColorDraft}
            onChange={onCoverTextColorChange}
            colorPresets={GALLERY_COVER_ACCENT_PRESETS}
            label="Title text color"
            hint="Color of the gallery name on the cover hero."
            className="mt-1"
          />
          <CoverColorPicker
            value={coverButtonColorDraft}
            onChange={onCoverButtonColorChange}
            colorPresets={GALLERY_COVER_ACCENT_PRESETS}
            label="Button color"
            hint="Border and text on the “View gallery” button."
            className="mt-1"
          />
        </div>
        <CoverFrameStylePicker
          value={coverFrameDraft}
          coverColor={coverColorDraft}
          onChange={onCoverFrameChange}
          coverFrames={coverFrameOptions}
          className="mt-3"
        />
      </CustomizeSection>

      <CustomizeSection
        icon={LayoutGrid}
        title="Grid & typography"
        description="Default grid style and fonts on the client link save automatically."
      >
        <div>
          <p className="mb-2 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Default grid style</p>
          <GalleryLayoutStylePicker
            value={previewLayout}
            onChange={onPreviewLayoutChange}
            gridLayouts={gridLayoutOptions}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FontSelect
            label="Title font"
            value={titleFont}
            options={titleFontOptions ?? ["Playfair Display"]}
            onChange={onTitleFontChange}
          />
          <FontSelect
            label="Body font"
            value={bodyFont}
            options={bodyFontOptions ?? ["Inter"]}
            onChange={onBodyFontChange}
          />
        </div>
      </CustomizeSection>

      <CustomizeSection
        icon={Shield}
        title="Client access"
        description="Background music and password protection apply to the client gallery."
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Music2 className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Background music</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {hasMusic
                      ? musicEnabled
                        ? "Playing for clients"
                        : "Uploaded but hidden from clients"
                      : "No track uploaded"}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                label="Background music"
                checked={musicEnabled}
                disabled={musicBusy || !hasMusic}
                onChange={onMusicEnabledChange}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={musicBusy}
                onClick={onUploadMusic}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden />
                {hasMusic ? "Replace track" : "Upload track"}
              </button>
              {hasMusic ? (
                <button
                  type="button"
                  disabled={musicBusy}
                  onClick={onRemoveMusic}
                  className="inline-flex items-center rounded-lg border border-red-200/80 bg-red-50/50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-lg px-0.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Allow downloads</p>
                <p className="text-[10px] text-zinc-500">Clients can download photos from the share link</p>
              </div>
              <ToggleSwitch
                label="Allow downloads"
                checked={allowDownloads}
                disabled={accessPinBusy}
                onChange={onAllowDownloadsChange}
              />
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Lock className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      Password protection
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {passwordProtection
                        ? "Clients enter a 4-digit code on the share link"
                        : "Anyone with the link can open"}
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  label="Password protection"
                  checked={passwordProtection}
                  disabled={accessPinBusy}
                  onChange={onPasswordProtectionChange}
                />
              </div>
              {passwordProtection && galleryAccessPin ? (
                <GalleryAccessPinPanel
                  pin={galleryAccessPin}
                  pinCopied={accessPinCopied}
                  busy={accessPinBusy}
                  onCopy={onCopyAccessPin}
                  onRegenerate={onRegenerateAccessPin}
                />
              ) : null}
            </div>

            <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      Require email to view
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {emailGateEnabled
                        ? "Clients enter their email before the gallery opens"
                        : "Gallery opens without collecting an email"}
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  label="Require email to view"
                  checked={emailGateEnabled}
                  disabled={emailGateBusy || accessPinBusy}
                  onChange={onEmailGateChange}
                />
              </div>
              {emailGateEnabled ? (
                <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Emails used to open
                  </p>
                  <GalleryAccessEmailList entries={galleryAccessEmails} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </CustomizeSection>
    </aside>
  );
}

export function WorkspaceSidebar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "w-full shrink-0 space-y-5 lg:w-[min(100%,380px)]",
        className,
      )}
    >
      {children}
    </aside>
  );
}

export function ClientSelectionLimitCard({
  selectionLimitDraft,
  onSelectionLimitDraftChange,
  onSave,
  saving,
  busy,
  helperText,
}: {
  selectionLimitDraft: string;
  onSelectionLimitDraftChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
  busy: boolean;
  helperText: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Client selection</h3>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        Limit how many photos your client can heart-pick before submitting. Leave blank for no
        limit.
      </p>
      <label className="mt-4 block">
        <span className="text-xs font-medium text-zinc-500">Max selections</span>
        <FormInput
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="0"
          disabled={busy || saving}
          value={selectionLimitDraft}
          onChange={(e) => onSelectionLimitDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
          }}
          className="mt-1.5"
        />
      </label>
      <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">{helperText}</p>
      <button
        type="button"
        disabled={busy || saving}
        onClick={onSave}
        className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-45"
      >
        {saving ? "Saving…" : "Save limit"}
      </button>
    </div>
  );
}

function shareClientAccessLine(clientName: string): string {
  const client = clientName.trim();
  if (!client || client === "Unknown client") {
    return "Send this link so your client can browse photos, leave notes, and submit their picks — no account needed.";
  }
  return `${client} can browse photos, heart selections, and submit picks through this portal.`;
}

export function ShareWithClientCard({
  title,
  clientName,
  eventDateLabel,
  shareUrl,
  shareActive,
  linkCopied,
  busy,
  onCopy,
  onRegenerate,
}: {
  title: string;
  clientName: string;
  eventDateLabel: string;
  shareUrl: string;
  shareActive: boolean;
  linkCopied: boolean;
  busy: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
}) {
  const galleryTitle = title.trim() || "Gallery";
  const client = clientName.trim();
  const knownClient = Boolean(client && client !== "Unknown client");
  const shareMessage = useMemo(
    () =>
      shareActive && shareUrl
        ? buildGalleryShareMessage(galleryTitle, shareUrl, knownClient ? client : undefined)
        : "",
    [shareActive, shareUrl, galleryTitle, client, knownClient],
  );

  const quickActionClass =
    "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[11px] font-semibold text-zinc-700 transition hover:border-brand/20 hover:bg-brand-soft/40 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-brand/30 dark:hover:bg-brand/10";

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-100 px-4 py-3.5 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand dark:bg-brand/15 dark:text-brand-on-dark"
              aria-hidden
            >
              <Link2 className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Share with client</h3>
              <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400" title={galleryTitle}>
                {galleryTitle}
                <span className="text-zinc-300 dark:text-zinc-600"> · </span>
                {eventDateLabel}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              shareActive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
            )}
          >
            {shareActive ? (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            ) : null}
            {shareActive ? "Live" : "Off"}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {shareActive
            ? shareClientAccessLine(clientName)
            : "Turn on sharing from gallery settings to generate a client portal link."}
        </p>

        <div>
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Client portal link</p>
          <div className="mt-1.5 flex overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
            <p
              className="min-w-0 flex-1 truncate px-3 py-2.5 font-mono text-[11px] leading-none text-zinc-600 dark:text-zinc-300"
              title={shareActive ? shareUrl : undefined}
            >
              {shareActive ? shareUrl : "Link not active yet"}
            </p>
            <button
              type="button"
              disabled={!shareActive}
              onClick={onCopy}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 border-l border-zinc-200 px-3 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700",
                linkCopied
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-white text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900",
              )}
            >
              {linkCopied ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
              {linkCopied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {shareActive ? (
          <div className="flex gap-2">
            <a
              href={buildMailtoShareUrl({
                subject: `Gallery: ${galleryTitle}`,
                body: shareMessage,
              })}
              className={quickActionClass}
            >
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Email
            </a>
            <a
              href={buildWhatsAppShareUrl(shareMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className={quickActionClass}
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              WhatsApp
            </a>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(quickActionClass, "text-brand dark:text-brand-on-dark")}
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Open
            </a>
          </div>
        ) : null}

        <button
          type="button"
          disabled={busy || !shareActive}
          onClick={onRegenerate}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 transition hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          <RefreshCw className={cn("h-3 w-3", busy && "animate-spin")} aria-hidden />
          Regenerate link
        </button>
      </div>
    </div>
  );
}

export type ActiveFeedbackItem = {
  id: string;
  name: string;
  thumbUrl: string;
  author: string;
  timeLabel: string;
  comment: string;
  photographerReply?: string;
};

function FeedbackThreadCard({
  item,
  photographerLabel,
  onSaveReply,
  saving,
  highlighted = false,
}: {
  item: ActiveFeedbackItem;
  photographerLabel: string;
  onSaveReply: (itemId: string, reply: string) => void | Promise<void>;
  saving: boolean;
  highlighted?: boolean;
}) {
  const [draft, setDraft] = useState(item.photographerReply ?? "");
  const savedReply = (item.photographerReply ?? "").trim();
  const draftTrimmed = draft.trim();
  const canSend = draftTrimmed !== savedReply;

  return (
    <article
      id={`feedback-thread-${item.id}`}
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-zinc-950",
        highlighted
          ? "border-brand/45 ring-2 ring-brand/20"
          : "border-zinc-200/90 dark:border-zinc-800",
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h4 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Active Feedback
        </h4>
        <span
          className="max-w-[52%] truncate text-xs font-medium text-zinc-400 dark:text-zinc-500"
          title={item.name}
        >
          {item.name}
        </span>
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {item.thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-zinc-300" aria-hidden />
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="rounded-2xl bg-zinc-100/90 px-4 py-3 dark:bg-zinc-800/80">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {item.author}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{item.timeLabel}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {item.comment}
          </p>
        </div>

        {savedReply ? (
          <div className="ml-6 rounded-2xl bg-brand-soft px-4 py-3 dark:bg-brand/15">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-semibold text-brand dark:text-brand-on-dark">
                {photographerLabel}
              </span>
              <span className="text-xs text-brand/70 dark:text-brand-on-dark/80">Sent</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
              {savedReply}
            </p>
          </div>
        ) : null}

        <div className="relative pt-1">
          <FormTextArea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Type a reply…"
            disabled={saving}
            className="min-h-[5.5rem] resize-none rounded-2xl pr-14"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSend && !saving) {
                e.preventDefault();
                void onSaveReply(item.id, draftTrimmed);
              }
            }}
          />
          <button
            type="button"
            disabled={saving || !canSend}
            aria-label={savedReply ? "Update reply" : "Send reply"}
            onClick={() => void onSaveReply(item.id, draftTrimmed)}
            className="absolute bottom-3 right-3 inline-flex size-9 items-center justify-center rounded-full bg-brand text-white shadow-md shadow-brand/25 transition enabled:hover:bg-brand-hover disabled:pointer-events-none disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

export function ActiveFeedbackPanel({
  items,
  emptyMessage,
  title = "Active feedback",
  subtitle = "Client comments & flagged notes",
  tip,
  onSaveReply,
  savingItemId = null,
  activeItemId = null,
  photographerLabel = "You",
}: {
  items: ActiveFeedbackItem[];
  emptyMessage: string;
  title?: string;
  subtitle?: string;
  tip?: string;
  onSaveReply?: (itemId: string, reply: string) => void | Promise<void>;
  savingItemId?: string | null;
  activeItemId?: string | null;
  photographerLabel?: string;
}) {
  const count = items.length;

  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand dark:bg-brand/15 dark:text-brand-on-dark">
            <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          </div>
        </div>
        {count > 0 ? (
          <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {count}
          </span>
        ) : null}
      </div>

      {count > 0 && onSaveReply ? (
        <div className="mt-4 max-h-[min(72vh,52rem)] space-y-4 overflow-y-auto pr-0.5">
          {items.map((item) => (
            <FeedbackThreadCard
              key={`${item.id}-${item.photographerReply ?? ""}`}
              item={item}
              photographerLabel={photographerLabel}
              onSaveReply={onSaveReply}
              saving={savingItemId === item.id}
              highlighted={activeItemId === item.id}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-6 dark:border-zinc-800 dark:bg-zinc-900/35">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-400 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-950 dark:text-zinc-500 dark:ring-white/10">
              <ImageIcon className="h-4.5 w-4.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">No feedback yet</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {emptyMessage}
              </p>
              <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                {tip ??
                  "Tip: feedback appears when a client adds a comment on a selected photo (or flags a final)."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SelectionFilterBar({
  mode,
  onModeChange,
  selectedCount,
  commentsCount,
}: {
  mode: "selected" | "comments";
  onModeChange: (mode: "selected" | "comments") => void;
  selectedCount: number;
  commentsCount: number;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-1 dark:border-zinc-800 dark:bg-zinc-900/60">
      <button
        type="button"
        onClick={() => onModeChange("selected")}
        className={cn(
          "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
          mode === "selected"
            ? "bg-brand text-white shadow-sm shadow-brand/25"
            : "text-zinc-600 hover:bg-white dark:text-zinc-400 dark:hover:bg-zinc-800",
        )}
      >
        Selected
        <span className={cn("ml-1.5 text-xs tabular-nums", mode === "selected" ? "text-white/95" : "text-zinc-400")}>
          {selectedCount}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onModeChange("comments")}
        className={cn(
          "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
          mode === "comments"
            ? "bg-brand text-white shadow-sm shadow-brand/25"
            : "text-zinc-600 hover:bg-white dark:text-zinc-400 dark:hover:bg-zinc-800",
        )}
      >
        Comments
        <span className={cn("ml-1.5 text-xs tabular-nums", mode === "comments" ? "text-white/95" : "text-zinc-400")}>
          {commentsCount}
        </span>
      </button>
    </div>
  );
}

