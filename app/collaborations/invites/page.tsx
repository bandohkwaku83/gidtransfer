"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Inbox, Loader2, X } from "lucide-react";
import {
  dashboardPageHeaderCtaClassName,
  dashboardPageHeaderCtaSecondaryClassName,
  dashboardPageHeaderDescriptionClassName,
  dashboardPageHeaderTitleClassName,
} from "@/components/dashboard/dashboard-page-header";
import {
  CollabAvatar,
  CollabBackLink,
  CollabBadge,
  CollabEmptyState,
  CollabLoadingState,
  CollabPageShell,
  CollabStatusDot,
  CollabSurface,
} from "@/components/collaborations/collab-ui";
import { useToast } from "@/components/toast-provider";
import {
  acceptCollaborationInvite,
  collaborationRoleLabel,
  leaveCollaboration,
  listPendingCollaborationInvites,
  type PendingCollaborationInvite,
} from "@/lib/collaborations-api";

export default function CollaborationInvitesInboxPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [invites, setInvites] = useState<PendingCollaborationInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { invites: next } = await listPendingCollaborationInvites();
      setInvites(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invites.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onAccept(invite: PendingCollaborationInvite) {
    setBusyId(invite.workspace.id);
    try {
      const res = await acceptCollaborationInvite(invite.workspace.id);
      showToast(res.message ?? "Invite accepted.", "success");
      router.push(`/collaborations/${res.workspace.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not accept invite.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function onDecline(invite: PendingCollaborationInvite) {
    setBusyId(invite.workspace.id);
    try {
      await leaveCollaboration(invite.workspace.id);
      setInvites((prev) => prev.filter((i) => i.workspace.id !== invite.workspace.id));
      showToast("Invite declined.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not decline invite.", "error");
    } finally {
      setBusyId(null);
    }
  }

  const openInvites = invites.filter((i) => !i.expired);
  const expiredInvites = invites.filter((i) => i.expired);

  return (
    <CollabPageShell narrow>
      <header>
        <nav className="mb-2">
          <CollabBackLink href="/collaborations">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Collaborations
          </CollabBackLink>
        </nav>
        <h1 className={dashboardPageHeaderTitleClassName()}>Pending invites</h1>
        <p className={dashboardPageHeaderDescriptionClassName()}>
          Accept or decline workspace invitations sent to your account.
        </p>
      </header>

      {loading ? (
        <CollabLoadingState label="Loading invites…" />
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : invites.length === 0 ? (
        <CollabEmptyState
          icon={<Inbox className="h-5 w-5" aria-hidden />}
          title="No pending invites"
          description="When a studio invites you, it will appear here."
          action={
            <Link
              href="/collaborations"
              className={dashboardPageHeaderCtaSecondaryClassName("inline-flex")}
            >
              Back to workspaces
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {openInvites.length > 0 ? (
            <ul className="space-y-3">
              {openInvites.map((invite) => {
                const busy = busyId === invite.workspace.id;
                const from =
                  invite.workspace.owner?.name ||
                  invite.workspace.owner?.email ||
                  "a studio";
                return (
                  <li key={`${invite.workspace.id}-${invite.member.id}`}>
                    <CollabSurface className="p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <CollabAvatar name={from} size="lg" />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                                {invite.workspace.name}
                              </p>
                              <CollabBadge tone="warn">
                                <CollabStatusDot status="pending" />
                                Pending
                              </CollabBadge>
                            </div>
                            <p className="mt-1 text-sm text-zinc-500">
                              From {from} · {collaborationRoleLabel(invite.member.role)}
                            </p>
                            {invite.workspace.description ? (
                              <p className="mt-1.5 line-clamp-2 text-sm text-zinc-400">
                                {invite.workspace.description}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void onAccept(invite)}
                            className={dashboardPageHeaderCtaClassName(
                              "inline-flex items-center gap-1.5",
                            )}
                          >
                            {busy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void onDecline(invite)}
                            className={dashboardPageHeaderCtaSecondaryClassName(
                              "inline-flex items-center gap-1.5",
                            )}
                          >
                            <X className="h-4 w-4" />
                            Decline
                          </button>
                        </div>
                      </div>
                    </CollabSurface>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {expiredInvites.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                Expired
              </p>
              <ul className="space-y-2 opacity-70">
                {expiredInvites.map((invite) => (
                  <li key={`expired-${invite.workspace.id}-${invite.member.id}`}>
                    <CollabSurface className="flex items-center gap-3 px-3.5 py-2.5">
                      <CollabAvatar
                        name={
                          invite.workspace.owner?.name ||
                          invite.workspace.owner?.email ||
                          invite.workspace.name
                        }
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
                          {invite.workspace.name}
                        </p>
                        <p className="text-xs text-zinc-400">Invite expired</p>
                      </div>
                      <CollabBadge tone="muted">Expired</CollabBadge>
                    </CollabSurface>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </CollabPageShell>
  );
}
