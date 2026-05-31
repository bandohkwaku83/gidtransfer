import { ApiError } from "@/lib/clients-api";
import { listDemoFoldersApiModels } from "@/lib/demo-api-bridge";

export type ApiNotification = {
  _id?: string;
  id?: string;
  type?: string;
  notificationType?: string;
  kind?: string;
  title?: string;
  body?: string;
  message?: string;
  readAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  folder?: string | { _id?: string };
  shareIdentifier?: string;
  shareCode?: string;
  slug?: string;
  booking?: string | { _id?: string };
};

export type ListNotificationsResponse = {
  notifications: ApiNotification[];
  count?: number;
  total?: number;
  unreadCount?: number;
  skip?: number;
  limit?: number;
};

const STORAGE = "gidostorage_demo_notifications_v1";

type Stored = { items: ApiNotification[] };

function seedNotifications(): ApiNotification[] {
  const folders = listDemoFoldersApiModels();
  const f = folders[0];
  const now = new Date().toISOString();
  const out: ApiNotification[] = [
    {
      _id: "n-demo-1",
      type: "selection_submit",
      title: "Client submitted selections",
      body: "Demo notification. Data is stored only in this browser.",
      readAt: null,
      createdAt: now,
      folder: f?._id,
      shareIdentifier: f?.share?.slug,
    },
  ];
  return out;
}

function readStore(): Stored {
  if (typeof window === "undefined") return { items: seedNotifications() };
  try {
    const raw = window.sessionStorage.getItem(STORAGE);
    if (!raw) {
      const s = { items: seedNotifications() };
      window.sessionStorage.setItem(STORAGE, JSON.stringify(s));
      return s;
    }
    const p = JSON.parse(raw) as unknown;
    if (p && typeof p === "object" && Array.isArray((p as Stored).items)) {
      return p as Stored;
    }
  } catch {
    /* fall through */
  }
  return { items: seedNotifications() };
}

function writeStore(s: Stored) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE, JSON.stringify(s));
}

async function delay(ms = 20) {
  await new Promise((r) => setTimeout(r, ms));
}

export function notificationRecordId(n: ApiNotification): string {
  const id = n._id ?? n.id;
  return typeof id === "string" ? id : "";
}

export function notificationTitle(n: ApiNotification): string {
  const t = n.title?.trim();
  if (t) return t;
  return "Notification";
}

export function notificationBody(n: ApiNotification): string {
  const b = n.body?.trim();
  if (b) return b;
  const m = n.message?.trim();
  if (m) return m;
  return "";
}

export function isNotificationUnread(n: ApiNotification): boolean {
  return n.readAt == null || n.readAt === "";
}

export function formatNotificationWhen(iso: string | undefined): string {
  if (!iso?.trim()) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function folderRefId(n: ApiNotification): string | undefined {
  const f = n.folder;
  if (typeof f === "string" && f.trim()) return f.trim();
  if (f && typeof f === "object" && typeof f._id === "string" && f._id.trim()) return f._id.trim();
  return undefined;
}

function shareToken(n: ApiNotification): string | undefined {
  const a = n.shareIdentifier?.trim();
  if (a) return a;
  const b = n.shareCode?.trim();
  if (b) return b;
  const c = n.slug?.trim();
  if (c) return c;
  return undefined;
}

function bookingRefId(n: ApiNotification): string | undefined {
  const b = n.booking;
  if (typeof b === "string" && b.trim()) return b.trim();
  if (b && typeof b === "object" && typeof b._id === "string" && b._id.trim()) return b._id.trim();
  return undefined;
}

export function notificationKind(n: ApiNotification): string {
  const o = n as Record<string, unknown>;
  const raw =
    o.type ??
    o.notificationType ??
    o.notification_type ??
    o.kind ??
    "";
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

export function notificationTargetHref(n: ApiNotification): string | null {
  const folderId = folderRefId(n);
  const share = shareToken(n);
  const bookingId = bookingRefId(n);
  const kind = notificationKind(n);

  if (folderId) {
    if (kind === "final_download") return `/dashboard/folder/${encodeURIComponent(folderId)}`;
    if (share) return `/g/${encodeURIComponent(share)}`;
    return `/dashboard/folder/${encodeURIComponent(folderId)}`;
  }
  if (bookingId) {
    return `/dashboard/schedules?booking=${encodeURIComponent(bookingId)}`;
  }
  return null;
}

export async function getNotificationsUnreadCount(): Promise<number> {
  await delay();
  const { items } = readStore();
  return items.filter(isNotificationUnread).length;
}

export async function listNotifications(params: {
  limit?: number;
  skip?: number;
  unreadOnly?: boolean;
}): Promise<ListNotificationsResponse> {
  await delay();
  const { items } = readStore();
  let rows = params.unreadOnly === true ? items.filter(isNotificationUnread) : [...items];
  const skip = params.skip ?? 0;
  const limit = params.limit ?? 30;
  rows = rows.slice(skip, skip + limit);
  const unreadCount = items.filter(isNotificationUnread).length;
  return {
    notifications: rows,
    count: rows.length,
    total: items.length,
    unreadCount,
    skip,
    limit,
  };
}

export async function markNotificationRead(id: string): Promise<void> {
  await delay();
  const safe = id.trim();
  if (!safe) throw new ApiError("Missing notification id", 400, null);
  const store = readStore();
  const next = store.items.map((n) =>
    notificationRecordId(n) === safe ? { ...n, readAt: new Date().toISOString() } : n,
  );
  writeStore({ items: next });
}

export async function markAllNotificationsRead(): Promise<{ modifiedCount?: number }> {
  await delay();
  const store = readStore();
  const now = new Date().toISOString();
  let n = 0;
  const next = store.items.map((x) => {
    if (isNotificationUnread(x)) {
      n += 1;
      return { ...x, readAt: now };
    }
    return x;
  });
  writeStore({ items: next });
  return { modifiedCount: n };
}
