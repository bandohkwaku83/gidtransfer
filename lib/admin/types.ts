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
  planName: string;
  subscriptionStatus: string;
  paystackSubscriptionCode: string | null;
  clientsCount: number;
  galleriesCount: number;
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
