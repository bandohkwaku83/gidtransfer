export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  isActive?: boolean;
}

export interface LoginResponse {
  message?: string;
  token: string;
  admin: AdminUser;
}

export interface StatsResponse {
  photographers: {
    total: number;
    onboarded: number;
    notOnboarded: number;
    active: number;
    inactive: number;
    emailVerified: number;
    emailUnverified: number;
    pendingSmsSenders: number;
    byPlan: Record<string, number>;
    bySubscriptionStatus: Record<string, number>;
    bySmsSenderStatus?: Record<string, number>;
    byAuthProvider?: Record<string, number>;
  };
  clients: { total: number };
  galleries: {
    active: number;
    trashed: number;
    byStatus: Record<string, number>;
  };
  support: { openIssueReports: number };
}

export interface StudioRef {
  userId: string;
  email: string | null;
  companyName: string;
  companySlug: string;
  isActive?: boolean;
}

export interface ClientRef {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  createdAt?: string;
}

export interface GalleryCounts {
  all: number;
  draft: number;
  selecting: number;
  done: number;
  trash: number;
}

export interface LimitOverride {
  storageLimitBytes: number | null;
  maxGalleries: number | null;
  expiresAt: string | null;
  reason: string;
  setAt: string;
}

export interface PhotographerListItem {
  userId: string;
  accountId: string;
  email: string;
  emailVerified: boolean;
  companyName: string;
  companyLogo: string | null;
  planName: string;
  subscriptionStatus: string;
  smsSenderId: string | null;
  smsSenderStatus: string | null;
  lastLoginAt: string | null;
  activeSessions: number;
  isActive: boolean;
  onboarded: boolean;
  authProvider: string;
  createdAt: string;
}

export interface PhotographerDetail {
  userId: string;
  accountId: string;
  email: string;
  emailVerified: boolean;
  authProvider: string;
  companyName: string;
  companyLogo: string | null;
  slug: string;
  country: string;
  phone: string;
  onboarded: boolean;
  onboardedAt: string | null;
  createdAt: string;
  isActive: boolean;
  planId: string;
  planName: string;
  subscriptionStatus: string;
  paystackSubscriptionCode: string | null;
  maxGalleries: number | null;
  limitOverride: LimitOverride | null;
  clientsCount: number;
  galleriesCount: number;
  galleryCounts: GalleryCounts | null;
  storageUsed: number;
  storageLimit: number;
  storageLabel: string;
  storageLimitLabel: string;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  loginCount: number;
  activeSessions: number;
  smsSenderId: string | null;
  smsSenderStatus: string | null;
  recentSessions: Session[];
}

export interface Session {
  id: string;
  authMethod: string;
  ip: string;
  userAgent: string;
  loggedInAt: string;
  lastSeenAt: string;
  isActive: boolean;
}

export interface GalleryShare {
  url: string | null;
  tokenPresent?: boolean;
  isShared: boolean;
  passwordProtected: boolean;
  shareExpiresAt: string | null;
  shareLinkExpiryDays: number | null;
  allowDownloads: boolean;
}

export interface GalleryListItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  eventDate: string | null;
  galleryType: string | null;
  galleryTypeLabel: string | null;
  client: ClientRef | null;
  studio: StudioRef;
  share: GalleryShare;
  selectionLocked: boolean;
  maxSelections: number | null;
  selectionSubmittedAt: string | null;
  deletedAt: string | null;
  restoreDeadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryDetail {
  id: string;
  name: string;
  slug: string;
  status: string;
  eventDate: string | null;
  description: string | null;
  galleryType: string | null;
  galleryTypeLabel: string | null;
  client: ClientRef | null;
  studio: StudioRef;
  photographerGalleryCounts: GalleryCounts | null;
  share: GalleryShare;
  selection: {
    locked: boolean;
    maxSelections: number | null;
    submittedAt: string | null;
  };
  trash: {
    deletedAt: string;
    restoreDeadline: string | null;
    restoreExpired: boolean;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryFilters {
  slug?: string;
  studioEmail?: string;
  clientName?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  shared?: string;
  passwordProtected?: string;
  selectionLocked?: string;
  allowDownloads?: string;
  trashOnly?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TrashItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  studio: StudioRef;
  deletedAt: string;
  restoreDeadline: string | null;
  restoreExpired: boolean;
}

export interface FlaggedFinal {
  id: string;
  galleryId: string;
  galleryName: string | null;
  gallerySlug: string | null;
  originalFilename: string;
  flaggedAt: string | null;
  feedback: { comment?: string; thread?: unknown[] } | null;
  studio: StudioRef;
  createdAt: string;
  updatedAt: string;
}

export interface CrmStudioListItem {
  userId: string;
  email: string | null;
  companyName: string;
  companySlug: string;
  isActive: boolean | null;
  clientCount: number;
  latestClientAt: string | null;
}

export interface CrmStudioDetail {
  studio: StudioRef;
  totals: {
    clients: number;
    upcomingBookings: number;
    bookingsThisMonth: number;
  };
  includePii: boolean;
  recentClients: ClientRef[];
  note?: string;
}

export interface CrmBooking {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  startsAt: string;
  endsAt: string | null;
  location?: string;
  amountCharged: number;
  currency: string;
  invoicedAt: string | null;
  studio: StudioRef;
  client: ClientRef;
  createdAt: string;
  updatedAt: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  description: string;
  storageLimitBytes: number;
  storageBytes: number;
  storageLabel: string;
  maxGalleries: number | null;
  perks: string[];
  priceGhs: number;
  interval: string | null;
  paystackPlanCode: string | null;
  available: boolean;
}

export interface BillingEvent {
  id: string;
  eventId: string;
  eventType: string;
  category: string;
  reference: string | null;
  amount: number;
  currency: string;
  status: string;
  processedAt: string | null;
  createdAt: string;
  user: {
    userId: string;
    email: string | null;
    companyName: string;
    companySlug: string;
    planId: string | null;
  } | null;
}

export interface IssueReportAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
}

export interface IssueReport {
  id: string;
  topic: string;
  topicLabel: string;
  userEmail: string;
  accountId: string;
  ownerId: string;
  description: string;
  status: "open" | "resolved";
  attachmentCount: number;
  attachments: IssueReportAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface IssueReportTopic {
  id: string;
  label: string;
}

export interface IssueReportsResponse extends PaginatedResponse<IssueReport> {
  topics: IssueReportTopic[];
}

export interface UpdateIssueReportResponse {
  message: string;
  report: IssueReport;
}

export interface CommunicationConfig {
  smsConfigured: boolean;
  emailConfigured: boolean;
  defaultSmsSender?: string;
  maxRecipients?: number | null;
  maxSmsLength: number;
  maxEmailMessageLength: number;
  maxSubjectLength: number;
}

export interface CommunicationRecord {
  id: string;
  channel: "sms" | "email";
  adminEmail: string;
  subject: string | null;
  message: string;
  createdAt: string;
  sent: number;
  failed: number;
  skipped: number;
  recipients?: CommunicationRecipient[];
}

export interface CommunicationRecipient {
  userId: string;
  accountId?: string;
  email: string;
  phone?: string;
  companyName?: string;
  status: "sent" | "failed" | "skipped";
  error?: string | null;
  skipReason?: string | null;
}

export interface SendResult {
  targeted: number;
  sent: number;
  failed: number;
  skipped: number;
  results?: {
    sms?: CommunicationRecipient[];
    email?: CommunicationRecipient[];
  };
}

export interface SmsSenderItem {
  userId: string;
  accountId: string;
  email: string;
  companyName: string;
  smsSenderId: string;
  smsSenderStatus: string;
  smsSenderRequestedAt: string;
  smsSenderRejectedReason?: string;
}

export interface PhotographerFilters {
  search?: string;
  onboarded?: string;
  emailVerified?: string;
  isActive?: string;
  planId?: string;
  subscriptionStatus?: string;
  smsSenderStatus?: string;
  authProvider?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}
