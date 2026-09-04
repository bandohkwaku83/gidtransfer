"use client";

import Link from "next/link";
import { FormEvent, use, useCallback, useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, UserPlus, X } from "lucide-react";
import { DashboardSpin } from "@/components/ui/skeletons";
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
  CollabLoadingState,
  CollabPageShell,
  CollabSectionLabel,
  CollabStatusDot,
  CollabSurface,
} from "@/components/collaborations/collab-ui";
import { PlanUpgradeHint } from "@/components/billing/plan-upgrade-hint";
import { useToast } from "@/components/toast-provider";
import { AuthFormInput } from "@/components/ui/form-input";
import {
  collaborationRoleAtLeast,
  collaborationRoleLabel,
  getCollaboration,
  inviteCollaborationMember,
  listCollaborationMembers,
  readCollaborationsErrorCode,
  removeCollaborationMember,
  type CollaborationMember,
  type CollaborationRole,
  type CollaborationSeats,
  type CollaborationWorkspace,
} from "@/lib/collaborations-api";
import { HttpError } from "@/lib/http";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";
import { cn } from "@/lib/utils";

export default function CollaborationMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { showToast } = useToast();
  const { handlePlanError, openUpgrade, plan } = usePlanEntitlements();

  const [workspace, setWorkspace] = useState<CollaborationWorkspace | null>(null);
  const [owner, setOwner] = useState<{
    id: string;
    email: string;
    name: string;
    role: "owner";
  } | null>(null);
  const [members, setMembers] = useState<CollaborationMember[]>([]);
  const [seats, setSeats] = useState<CollaborationSeats>({ used: 0, max: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<CollaborationRole, "owner">>("editor");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isOwner = collaborationRoleAtLeast(workspace?.role, "owner");
  const maxSeats = seats.max ?? plan?.maxTeamMembers ?? null;
  const seatPct =
    maxSeats != null && maxSeats > 0
      ? Math.min(100, Math.round((seats.used / maxSeats) * 100))
      : null;
  const pendingCount = members.filter((m) => m.status === "invited").length;
  const activeCount =
    (owner ? 1 : 0) + members.filter((m) => m.status === "active").length;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ workspace: ws }, membersRes] = await Promise.all([
        getCollaboration(id),
        listCollaborationMembers(id),
      ]);
      setWorkspace(ws);
      setOwner(membersRes.owner);
      setMembers(membersRes.members);
      setSeats(membersRes.seats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    if (!isOwner) return;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      showToast("Enter an email address.", "error");
      return;
    }
    setInviting(true);
    try {
      const res = await inviteCollaborationMember(id, { email: trimmed, role });
      setMembers((prev) => {
        const without = prev.filter((m) => m.id !== res.member.id);
        return [res.member, ...without];
      });
      setSeats(res.seats);
      setEmail("");
      showToast(res.message ?? "Invite sent.", "success");
    } catch (err) {
      if (handlePlanError(err)) return;
      const code = readCollaborationsErrorCode(err);
      if (code === "USER_NOT_REGISTERED") {
        showToast(
          err instanceof Error
            ? err.message
            : "No Photo Global account for this email. Ask them to sign up first.",
          "error",
        );
        return;
      }
      if (code === "TEAM_MEMBER_LIMIT_REACHED") {
        const body =
          err instanceof HttpError && err.body && typeof err.body === "object"
            ? (err.body as { maxTeamMembers?: number; message?: string })
            : null;
        openUpgrade({
          feature: "collaboration",
          message:
            body?.message ??
            `Team member limit reached${body?.maxTeamMembers != null ? ` (${body.maxTeamMembers})` : ""}. Remove a member or upgrade.`,
          suggestedPlanId: "premium",
          requiredPlans: ["premium"],
        });
        return;
      }
      showToast(err instanceof Error ? err.message : "Invite failed.", "error");
    } finally {
      setInviting(false);
    }
  }

  async function onRemove(member: CollaborationMember) {
    if (!isOwner) return;
    if (!window.confirm(`Remove ${member.user?.name || member.email}?`)) return;
    setRemovingId(member.id);
    try {
      await removeCollaborationMember(id, member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setSeats((prev) => ({
        ...prev,
        used: Math.max(0, prev.used - (member.status === "active" ? 1 : 0)),
      }));
      showToast("Member removed.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not remove member.", "error");
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <CollabPageShell>
        <CollabLoadingState label="Loading members…" />
      </CollabPageShell>
    );
  }

  if (error || !workspace) {
    return (
      <CollabPageShell>
        <div className="mx-auto max-w-lg py-16 text-center">
          <p className="text-sm text-zinc-600">{error ?? "Not found."}</p>
          <Link
            href="/collaborations"
            className={dashboardPageHeaderCtaSecondaryClassName("mt-6 inline-flex")}
          >
            Back
          </Link>
        </div>
      </CollabPageShell>
    );
  }

  return (
    <CollabPageShell>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-sm text-zinc-400">
            <CollabBackLink href={`/collaborations/${id}`}>
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              {workspace.name}
            </CollabBackLink>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <span className="font-medium text-zinc-700 dark:text-zinc-200">Members</span>
          </nav>
          <h1 className={dashboardPageHeaderTitleClassName()}>Team</h1>
          <p className={dashboardPageHeaderDescriptionClassName()}>
            {isOwner
              ? "Invite registered Photo Global users as editors or viewers."
              : "People with access to this workspace."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CollabBadge tone="neutral">{activeCount} active</CollabBadge>
          {pendingCount > 0 ? (
            <CollabBadge tone="warn">{pendingCount} pending</CollabBadge>
          ) : null}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
        <div className="min-w-0 space-y-4">
          {isOwner ? (
            <CollabSurface as="form" onSubmit={onInvite} className="p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-on-dark">
                  <UserPlus className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Invite teammate
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    They must already have a Photo Global account. Invites expire in 7 days.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <AuthFormInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="second@studio.com"
                  className="flex-1"
                  required
                />
                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value === "viewer" ? "viewer" : "editor")
                  }
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting}
                  className={dashboardPageHeaderCtaClassName(
                    "inline-flex items-center justify-center gap-2",
                  )}
                >
                  {inviting ? (
                    <DashboardSpin size="small" />
                  ) : (
                    <UserPlus className="h-4 w-4" aria-hidden />
                  )}
                  Invite
                </button>
              </div>
              {maxSeats != null && seats.used >= maxSeats ? (
                <div className="mt-3">
                  <PlanUpgradeHint
                    compact
                    feature="collaboration"
                    suggestedPlanId="premium"
                    title="Seat limit reached"
                    description="Remove a member, or upgrade Premium for more seats."
                    label="Upgrade"
                  />
                </div>
              ) : null}
            </CollabSurface>
          ) : null}

          <CollabSurface className="overflow-hidden">
            <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <CollabSectionLabel className="mb-0">People</CollabSectionLabel>
            </div>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {owner ? (
                <li className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <CollabAvatar name={owner.name || owner.email} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {owner.name || owner.email}
                      </p>
                      <p className="truncate text-xs text-zinc-500">{owner.email}</p>
                    </div>
                  </div>
                  <CollabBadge tone="brand">Owner</CollabBadge>
                </li>
              ) : null}
              {members.map((member) => {
                const display = member.user?.name || member.email;
                return (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <CollabAvatar name={display} size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {display}
                        </p>
                        <p className="flex items-center gap-1.5 truncate text-xs text-zinc-500">
                          {member.status === "invited" ? (
                            <>
                              <CollabStatusDot status="pending" />
                              Pending invite
                            </>
                          ) : (
                            member.email
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <CollabBadge
                        tone={member.status === "invited" ? "warn" : "neutral"}
                      >
                        {collaborationRoleLabel(member.role)}
                      </CollabBadge>
                      {isOwner ? (
                        <button
                          type="button"
                          disabled={removingId === member.id}
                          onClick={() => void onRemove(member)}
                          className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          aria-label={`Remove ${member.email}`}
                        >
                          {removingId === member.id ? (
                            <DashboardSpin size="small" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
              {members.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-zinc-500">
                  {isOwner
                    ? "No invited members yet — invite a second shooter or editor above."
                    : "Only the owner is in this workspace so far."}
                </li>
              ) : null}
            </ul>
          </CollabSurface>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <CollabSurface className="p-4">
            <CollabSectionLabel>Seats</CollabSectionLabel>
            <p className="font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {seats.used}
              {maxSeats != null ? (
                <span className="text-base font-medium text-zinc-400"> / {maxSeats}</span>
              ) : null}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Team seats in use</p>
            {seatPct != null ? (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    seatPct >= 100 ? "bg-amber-500" : "bg-brand",
                  )}
                  style={{ width: `${seatPct}%` }}
                />
              </div>
            ) : null}
          </CollabSurface>

          <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">
              Roles
            </p>
            <ul className="mt-2.5 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              <li>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">Editor</span>
                {" — "}upload and organize media
              </li>
              <li>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">Viewer</span>
                {" — "}browse without changes
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </CollabPageShell>
  );
}
