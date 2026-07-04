import { sameOriginUploadsUrl } from "@/lib/api";
import { mapApiUserToAuthUser } from "@/lib/auth-api";
import {
  cacheOnboardingProfile,
  getAuthToken,
  setAuthSession,
} from "@/lib/auth-demo";
import {
  apiGalleryDefaultsToSettings,
  deleteGalleryDefaultCover,
  updateGalleryWatermarkPreview,
  uploadGalleryDefaultCover,
  type ApiGalleryDefaults,
  type GalleryDefaultsSettingsFields,
} from "@/lib/gallery-defaults-api";
import { authedFormUpload, authedJson, HttpError } from "@/lib/http";
import { apiCacheKey, cachedApiCall, invalidateApiCache, invalidateApiCacheByTags } from "@/lib/api-cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  DEFAULT_EMAIL_NOTIFICATIONS,
  normalizeEmailNotifications,
  type EmailNotifications,
} from "@/lib/email-notifications";
import { studioSmsFieldsFromApi, type StudioSmsFields } from "@/lib/sms-sender";
import { parseTenantFromHostname } from "@/lib/studio-url";
import type { PlanId } from "@/lib/subscription-plan";
import {
  getDuplicateUploadPreference,
  setDuplicateUploadPreference,
  type DuplicateUploadAction,
} from "@/lib/upload-preferences";
import { apiWatermarkToBrand, type ApiWatermarkPayload } from "@/lib/watermark-api";
import {
  defaultBrandWatermarkSettings,
  getBrandWatermarkSettings,
  normalizeBrandWatermarkSettings,
  saveBrandWatermarkSettings,
  type BrandWatermarkSettings,
} from "@/lib/watermark-brand";

export type ApiSettingsProfile = {
  displayName: string;
  email: string;
  avatarSrc: string | null;
  planName: string;
  profileComplete: boolean;
  profileStatusLabel: string;
};

export type ApiSettingsGalleriesOverview = {
  used: number;
  /** null = no gallery cap on the current plan */
  limit: number | null;
  label: string;
};

export type ApiSettingsOverview = {
  galleries: ApiSettingsGalleriesOverview;
  planStorage: {
    limitBytes: number;
    usedBytes: number;
    label: string;
    percentOfPlan: number;
  };
  memberSince: { date: string; label: string };
};

export type ApiSettingsStudio = {
  businessName: string;
  companyName: string;
  companySlug?: string | null;
  suggestedCompanySlug?: string | null;
  phone: string | null;
  website: string | null;
  logoSrc: string | null;
  logoUrl: string | null;
  studioUrl: string | null;
  studioUrlHost: string | null;
  studioUrlSuffix: string | null;
  appHost: string | null;
} & Partial<StudioSmsFields>;

export type ApiSettingsNotifications = {
  email: EmailNotifications;
};

export type ApiSettingsAccount = {
  email: string;
  role: string;
  accountId: string;
};

export type ApiSettingsUser = {
  _id: string;
  accountId: string;
  email: string;
  role: string;
  authProvider?: string;
  agreedToTermsAt?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  memberSince?: { date: string; label: string };
  onboardingComplete?: boolean;
  emailNotifications?: EmailNotifications;
  studio?: {
    companyName?: string;
    companySlug?: string;
    suggestedCompanySlug?: string;
    studioUrl?: string;
    studioUrlHost?: string;
    studioUrlSuffix?: string;
    appHost?: string;
    phone?: string;
    website?: string;
  } & Partial<StudioSmsFields>;
};

export type SettingsProfileSectionResponse = {
  profile: ApiSettingsProfile;
  overview: ApiSettingsOverview;
};

export type SettingsOverviewSectionResponse = {
  overview: ApiSettingsOverview;
  profile: Pick<ApiSettingsProfile, "planName" | "profileComplete" | "profileStatusLabel">;
};

export type SettingsStudioSectionResponse = {
  studio: ApiSettingsStudio;
};

export type SettingsAccountSectionResponse = {
  account: ApiSettingsAccount;
};

export type SaveSettingsResponse = SettingsPayload & {
  message?: string;
};

export type UpdateProfileSettingsInput = {
  businessName: string;
  companySlug: string;
  phone: string;
  website?: string;
  smsSenderId?: string;
  logoFile?: File | null;
  avatarFile?: File | null;
};

export type ApiSettingsBundle = {
  profile: ApiSettingsProfile;
  overview: ApiSettingsOverview;
  studio: ApiSettingsStudio;
  account: ApiSettingsAccount;
  notifications?: ApiSettingsNotifications;
  watermark: ApiWatermarkPayload;
  galleryDefaults: ApiGalleryDefaults;
};

export type SettingsPayload = {
  settings: ApiSettingsBundle;
  user: ApiSettingsUser;
};

export type ApiSettings = {
  watermarkPreviewImages: boolean;
  brandWatermark: BrandWatermarkSettings;
  defaultCoverImage?: string;
  defaultCoverImageUrl?: string;
  duplicateUploadAction?: DuplicateUploadAction;
};

export type SettingsPageData = {
  flat: ApiSettings;
  bundle: ApiSettingsBundle;
  user: ApiSettingsUser;
};

export type UpdateSettingsInput = {
  watermarkPreviewImages?: boolean;
  brandWatermark?: BrandWatermarkSettings;
  defaultCoverImage?: File | null;
  duplicateUploadAction?: DuplicateUploadAction;
};

export class SettingsApiError extends HttpError {}

export function settingsErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof SettingsApiError) {
    if (err.status === 409) {
      const msg = err.message?.trim();
      if (msg && /sms display name/i.test(msg)) return msg;
      return "This studio URL is already taken";
    }
    return err.message || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function coerceMediaUrl(url: string | null | undefined): string | undefined {
  if (typeof url !== "string" || !url.trim()) return undefined;
  return sameOriginUploadsUrl(url.trim());
}

/** Prefer the server-authored label (e.g. `"0"` when unlimited, `"2 / 5"` when capped). */
export function galleriesOverviewDisplay(
  galleries: ApiSettingsGalleriesOverview | undefined,
  fallback?: { used: number; limit: number | null },
): string {
  if (galleries?.label?.trim()) return galleries.label.trim();
  const used = galleries?.used ?? fallback?.used ?? 0;
  const limit =
    galleries?.limit !== undefined ? galleries.limit : (fallback?.limit ?? null);
  if (limit != null) return `${used} / ${limit}`;
  return String(used);
}

export function planNameToPlanId(planName: string): PlanId {
  const n = planName.trim().toLowerCase();
  if (n.includes("pro")) return "pro";
  if (n.includes("studio")) return "studio";
  if (n.includes("starter")) return "starter";
  return "free";
}

export function studioSlugFromSettings(
  studio: ApiSettingsStudio,
  fallbackSlug?: string | null,
): string {
  const fromApi = studio.companySlug?.trim();
  if (fromApi) return fromApi;

  const fromFallback = fallbackSlug?.trim();
  if (fromFallback) return fromFallback;

  const host = studio.studioUrlHost?.trim();
  if (host) {
    const fromHost = parseTenantFromHostname(host);
    if (fromHost) return fromHost;
  }

  const studioUrl = studio.studioUrl?.trim();
  if (studioUrl) {
    try {
      const href = studioUrl.includes("://") ? studioUrl : `http://${studioUrl}`;
      const fromUrl = parseTenantFromHostname(new URL(href).host);
      if (fromUrl) return fromUrl;
    } catch {
      /* ignore malformed URL */
    }
  }

  return "";
}

export function studioLogoUrlFromSettings(studio: ApiSettingsStudio): string | undefined {
  return coerceMediaUrl(studio.logoUrl ?? studio.logoSrc);
}

function normalizeSettingsPayload(raw: unknown): ApiSettings {
  const obj =
    raw &&
    typeof raw === "object" &&
    "settings" in raw &&
    (raw as { settings: unknown }).settings &&
    typeof (raw as { settings: unknown }).settings === "object"
      ? ((raw as { settings: Record<string, unknown> }).settings as Record<string, unknown>)
      : raw && typeof raw === "object"
        ? (raw as Record<string, unknown>)
        : {};

  const dupRaw =
    obj.duplicateUploadAction ?? obj.duplicate_upload_action ?? obj.duplicateAction;
  let duplicateUploadAction: DuplicateUploadAction | undefined;
  if (dupRaw === "replace" || dupRaw === "ignore") {
    duplicateUploadAction = dupRaw;
  }

  const brandRaw = obj.brandWatermark ?? obj.brand_watermark ?? obj.watermark;
  const normalized: ApiSettings = {
    watermarkPreviewImages: Boolean(
      obj.watermarkPreviewImages ?? obj.watermark_preview_images,
    ),
    brandWatermark: normalizeBrandWatermarkSettings(
      brandRaw ?? (typeof window !== "undefined" ? getBrandWatermarkSettings() : undefined),
    ),
    defaultCoverImage:
      typeof obj.defaultCoverImage === "string" ? obj.defaultCoverImage : undefined,
    defaultCoverImageUrl:
      typeof obj.defaultCoverImageUrl === "string" ? obj.defaultCoverImageUrl : undefined,
    duplicateUploadAction,
  };

  if (typeof window !== "undefined" && duplicateUploadAction) {
    setDuplicateUploadPreference(duplicateUploadAction);
  }

  return normalized;
}

function settingsPayloadToFlat(payload: SettingsPayload): ApiSettings {
  const galleryFields = apiGalleryDefaultsToSettings(payload.settings.galleryDefaults);
  const brandWatermark = apiWatermarkToBrand(payload.settings.watermark);
  saveBrandWatermarkSettings(brandWatermark);

  const dup =
    typeof window !== "undefined" ? getDuplicateUploadPreference() : undefined;

  return {
    ...galleryFields,
    brandWatermark,
    duplicateUploadAction: dup,
  };
}

function defaultGalleryDefaults(): ApiGalleryDefaults {
  return {
    watermarkPreviewEnabled: false,
    watermarkPreview: {
      enabled: false,
      title: "Watermark preview images",
      description:
        "Adds a text watermark on client selection thumbnails. Brand logo on finals is under Watermark.",
    },
    defaultCover: {
      hasCover: false,
      coverSrc: null,
      coverUrl: null,
      emptyStateLabel: null,
    },
  };
}

function defaultWatermarkPayload(): ApiWatermarkPayload {
  return { enabled: false };
}

function defaultNotifications(): ApiSettingsNotifications {
  return { email: { ...DEFAULT_EMAIL_NOTIFICATIONS } };
}

function buildBundleFromSections(input: {
  profile: ApiSettingsProfile;
  overview: ApiSettingsOverview;
  studio: ApiSettingsStudio;
  account: ApiSettingsAccount;
  notifications?: ApiSettingsNotifications;
  watermark?: ApiWatermarkPayload;
  galleryDefaults?: ApiGalleryDefaults;
}): ApiSettingsBundle {
  return {
    profile: input.profile,
    overview: input.overview,
    studio: input.studio,
    account: input.account,
    notifications: input.notifications ?? defaultNotifications(),
    watermark: input.watermark ?? defaultWatermarkPayload(),
    galleryDefaults: input.galleryDefaults ?? defaultGalleryDefaults(),
  };
}

export function pageDataFromPayload(payload: SettingsPayload): SettingsPageData {
  const bundle = requireSettingsBundle(payload);
  const notifications =
    bundle.notifications ??
    (payload.user?.emailNotifications
      ? { email: normalizeEmailNotifications(payload.user.emailNotifications) }
      : defaultNotifications());

  return {
    flat: settingsPayloadToFlat(payload),
    bundle: { ...bundle, notifications },
    user: payload.user,
  };
}

function mergeProfileSummary(
  current: ApiSettingsProfile,
  summary: SettingsOverviewSectionResponse["profile"],
): ApiSettingsProfile {
  return {
    ...current,
    planName: summary.planName,
    profileComplete: summary.profileComplete,
    profileStatusLabel: summary.profileStatusLabel,
  };
}

export function mergePageData(
  current: SettingsPageData | null,
  partial: {
    profile?: ApiSettingsProfile;
    overview?: ApiSettingsOverview;
    studio?: ApiSettingsStudio;
    account?: ApiSettingsAccount;
    notifications?: ApiSettingsNotifications;
    profileSummary?: SettingsOverviewSectionResponse["profile"];
    user?: ApiSettingsUser;
    flat?: ApiSettings;
    watermark?: ApiWatermarkPayload;
    galleryDefaults?: ApiGalleryDefaults;
  },
): SettingsPageData {
  const bundle = buildBundleFromSections({
    profile: partial.profileSummary && current?.bundle.profile
      ? mergeProfileSummary(current.bundle.profile, partial.profileSummary)
      : partial.profile ?? current?.bundle.profile ?? {
          displayName: "",
          email: "",
          avatarSrc: null,
          planName: "Free plan",
          profileComplete: false,
          profileStatusLabel: "Profile incomplete",
        },
    overview: partial.overview ?? current?.bundle.overview ?? {
      galleries: { used: 0, limit: null, label: "0" },
      planStorage: { limitBytes: 0, usedBytes: 0, label: "0 GB", percentOfPlan: 0 },
      memberSince: { date: "", label: "" },
    },
    studio: partial.studio ?? current?.bundle.studio ?? {
      businessName: "",
      companyName: "",
      phone: null,
      website: null,
      logoSrc: null,
      logoUrl: null,
      studioUrl: null,
      studioUrlHost: null,
      studioUrlSuffix: null,
      appHost: null,
    },
    account: partial.account ?? current?.bundle.account ?? {
      email: "",
      role: "Photographer",
      accountId: "",
    },
    notifications: partial.notifications ?? current?.bundle.notifications ?? defaultNotifications(),
    watermark: partial.watermark ?? current?.bundle.watermark,
    galleryDefaults: partial.galleryDefaults ?? current?.bundle.galleryDefaults,
  });

  return {
    flat: partial.flat ?? current?.flat ?? {
      watermarkPreviewImages: false,
      brandWatermark: defaultBrandWatermarkSettings(),
    },
    bundle,
    user: partial.user ?? current?.user ?? {
      _id: "",
      accountId: "",
      email: bundle.account.email,
      role: bundle.account.role,
    },
  };
}

function requireSettingsBundle(body: SettingsPayload): ApiSettingsBundle {
  if (!body.settings) {
    throw new SettingsApiError("Settings missing from response", 500, body);
  }
  return body.settings;
}

/** Best URL to show the default cover from settings, or null when none is configured. */
export function getSettingsDefaultCoverUrl(settings: ApiSettings): string | null {
  const u = settings.defaultCoverImageUrl ?? settings.defaultCoverImage;
  if (typeof u !== "string") return null;
  const trimmed = u.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) return trimmed;
  return null;
}

export async function fetchSettingsPayload(): Promise<SettingsPayload> {
  return cachedApiCall(
    apiCacheKey("GET", "/api/settings"),
    () =>
      authedJson<SettingsPayload>(
        "/api/settings",
        { method: "GET" },
        "Failed to load settings",
        SettingsApiError,
      ),
    { ttlMs: 120_000, tags: [CACHE_TAGS.settings] },
  );
}

export function persistSettingsSession(payload: SettingsPayload): void {
  const token = getAuthToken()?.trim();
  if (!token) return;

  const { settings, user } = payload;
  const studio = settings.studio;
  const userStudio = user.studio;
  const companySlug = studioSlugFromSettings(studio, userStudio?.companySlug);
  const logoUrl = studioLogoUrlFromSettings(studio);
  const smsFields = studioSmsFieldsFromApi({ ...userStudio, ...studio });

  const mapped = mapApiUserToAuthUser(
    {
      _id: user._id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      onboardingComplete: user.onboardingComplete,
      studio: {
        companyName:
          studio.companyName?.trim() ||
          studio.businessName?.trim() ||
          userStudio?.companyName?.trim() ||
          undefined,
        ...(companySlug ? { companySlug } : {}),
        ...(studio.phone?.trim() || userStudio?.phone?.trim()
          ? { phone: (studio.phone ?? userStudio?.phone)?.trim() }
          : {}),
        ...(studio.website?.trim() || userStudio?.website?.trim()
          ? { website: (studio.website ?? userStudio?.website)?.trim() }
          : {}),
        ...(logoUrl ? { logoSrc: logoUrl, logoUrl } : {}),
        ...((studio.studioUrl ?? userStudio?.studioUrl)?.trim()
          ? { studioUrl: (studio.studioUrl ?? userStudio?.studioUrl)?.trim() }
          : {}),
        ...((studio.studioUrlSuffix ?? userStudio?.studioUrlSuffix)?.trim()
          ? {
              studioUrlSuffix: (studio.studioUrlSuffix ?? userStudio?.studioUrlSuffix)?.trim(),
            }
          : {}),
        ...smsFields,
      },
    },
    {
      studioUrl: studio.studioUrl ?? userStudio?.studioUrl,
      studioUrlSuffix: studio.studioUrlSuffix ?? userStudio?.studioUrlSuffix,
    },
  );

  setAuthSession({
    email: mapped.email,
    token,
    user: mapped,
  });

  if (mapped.onboardingComplete && mapped.studio) {
    cacheOnboardingProfile(mapped, mapped.studio);
  }
}

export async function fetchSettingsProfileSection(): Promise<SettingsProfileSectionResponse> {
  return authedJson<SettingsProfileSectionResponse>(
    "/api/settings/profile",
    { method: "GET" },
    "Failed to load profile settings",
    SettingsApiError,
  );
}

export async function fetchSettingsOverviewSection(): Promise<SettingsOverviewSectionResponse> {
  return authedJson<SettingsOverviewSectionResponse>(
    "/api/settings/overview",
    { method: "GET" },
    "Failed to load plan overview",
    SettingsApiError,
  );
}

export async function fetchSettingsStudioSection(): Promise<SettingsStudioSectionResponse> {
  return authedJson<SettingsStudioSectionResponse>(
    "/api/settings/studio",
    { method: "GET" },
    "Failed to load studio settings",
    SettingsApiError,
  );
}

export async function fetchSettingsAccountSection(): Promise<SettingsAccountSectionResponse> {
  return authedJson<SettingsAccountSectionResponse>(
    "/api/settings/account",
    { method: "GET" },
    "Failed to load account settings",
    SettingsApiError,
  );
}

function profileSettingsFormData(input: UpdateProfileSettingsInput): FormData {
  const form = new FormData();
  form.append("businessName", input.businessName.trim());
  form.append("companySlug", input.companySlug.trim());
  form.append("phone", input.phone.trim());
  const website = input.website?.trim();
  if (website) form.append("website", website);
  const smsSenderId = input.smsSenderId?.trim();
  if (smsSenderId) form.append("smsSenderId", smsSenderId.toUpperCase());
  if (input.logoFile) form.append("logo", input.logoFile);
  if (input.avatarFile) form.append("avatar", input.avatarFile);
  return form;
}

export async function updateProfileSettings(
  input: UpdateProfileSettingsInput,
): Promise<SettingsPageData> {
  const form = profileSettingsFormData(input);
  const body = await authedFormUpload<SaveSettingsResponse>("/api/settings", form, {
    method: "PUT",
    fallbackError: "Failed to save profile",
    ErrorCtor: SettingsApiError,
  });
  if (!body.settings || !body.user) {
    throw new SettingsApiError("Profile saved but settings were missing from response", 500, body);
  }
  persistSettingsSession(body);
  return pageDataFromPayload(body);
}

export async function fetchSettingsPageData(): Promise<SettingsPageData> {
  const [profileSection, studioSection, accountSection, fullPayload] = await Promise.all([
    fetchSettingsProfileSection(),
    fetchSettingsStudioSection(),
    fetchSettingsAccountSection(),
    fetchSettingsPayload().catch(() => null),
  ]);

  if (fullPayload) {
    persistSettingsSession(fullPayload);
    return pageDataFromPayload(fullPayload);
  }

  const flat = await legacyGetSettings();
  return mergePageData(null, {
    profile: profileSection.profile,
    overview: profileSection.overview,
    studio: studioSection.studio,
    account: accountSection.account,
    flat,
  });
}

export async function fetchSettingsTabData(
  tab: "profile" | "billing" | "gallery" | "watermark",
  current: SettingsPageData | null,
): Promise<SettingsPageData> {
  switch (tab) {
    case "profile": {
      const [profileSection, studioSection, accountSection] = await Promise.all([
        fetchSettingsProfileSection(),
        fetchSettingsStudioSection(),
        fetchSettingsAccountSection(),
      ]);
      return mergePageData(current, {
        profile: profileSection.profile,
        overview: profileSection.overview,
        studio: studioSection.studio,
        account: accountSection.account,
      });
    }
    case "billing": {
      const overviewSection = await fetchSettingsOverviewSection();
      return mergePageData(current, {
        overview: overviewSection.overview,
        profileSummary: overviewSection.profile,
      });
    }
    case "gallery":
    case "watermark": {
      const payload = await fetchSettingsPayload();
      persistSettingsSession(payload);
      return pageDataFromPayload(payload);
    }
    default:
      return current ?? mergePageData(null, {});
  }
}

async function legacyGetSettings(): Promise<ApiSettings> {
  const dup = typeof window !== "undefined" ? getDuplicateUploadPreference() : undefined;
  let brandWatermark: BrandWatermarkSettings =
    typeof window !== "undefined"
      ? getBrandWatermarkSettings()
      : defaultBrandWatermarkSettings();

  const { getWatermarkSettings } = await import("@/lib/watermark-api");
  const { getGalleryDefaults } = await import("@/lib/gallery-defaults-api");

  try {
    brandWatermark = await getWatermarkSettings();
  } catch {
    // Keep cached/local watermark when the dedicated endpoint is unavailable.
  }

  let galleryFields = { watermarkPreviewImages: false };
  try {
    galleryFields = apiGalleryDefaultsToSettings(await getGalleryDefaults());
  } catch {
    // Keep defaults when the gallery-defaults endpoint is unavailable.
  }

  return normalizeSettingsPayload({
    ...galleryFields,
    brandWatermark,
    duplicateUploadAction: dup,
  });
}

export async function getSettings(): Promise<ApiSettings> {
  try {
    const payload = await fetchSettingsPayload();
    persistSettingsSession(payload);
    return settingsPayloadToFlat(payload);
  } catch {
    return legacyGetSettings();
  }
}

export async function updateSettings(input: UpdateSettingsInput): Promise<ApiSettings> {
  const cur = await getSettings();
  if (input.duplicateUploadAction !== undefined) {
    setDuplicateUploadPreference(input.duplicateUploadAction);
  }
  const brandWatermark =
    input.brandWatermark !== undefined
      ? normalizeBrandWatermarkSettings(input.brandWatermark)
      : cur.brandWatermark;
  if (typeof window !== "undefined" && input.brandWatermark !== undefined) {
    saveBrandWatermarkSettings(brandWatermark);
  }

  let galleryFields: GalleryDefaultsSettingsFields = {
    watermarkPreviewImages: cur.watermarkPreviewImages,
    defaultCoverImage: cur.defaultCoverImage,
    defaultCoverImageUrl: cur.defaultCoverImageUrl,
  };

  try {
    if (input.defaultCoverImage === null) {
      galleryFields = apiGalleryDefaultsToSettings(await deleteGalleryDefaultCover());
    } else if (input.defaultCoverImage instanceof File) {
      galleryFields = apiGalleryDefaultsToSettings(
        await uploadGalleryDefaultCover(input.defaultCoverImage),
      );
    } else if (input.watermarkPreviewImages !== undefined) {
      galleryFields = apiGalleryDefaultsToSettings(
        await updateGalleryWatermarkPreview(input.watermarkPreviewImages),
      );
    }
  } catch (err) {
    if (err instanceof HttpError) {
      throw new SettingsApiError(err.message, err.status, err.body);
    }
    throw err;
  }

  try {
    invalidateApiCacheByTags([CACHE_TAGS.settings]);
    invalidateApiCache("/api/settings");
    const payload = await fetchSettingsPayload();
    persistSettingsSession(payload);
    return settingsPayloadToFlat(payload);
  } catch {
    return normalizeSettingsPayload({
      ...galleryFields,
      brandWatermark,
      duplicateUploadAction: input.duplicateUploadAction ?? getDuplicateUploadPreference(),
    });
  }
}
