"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  FolderKanban,
  Inbox,
  Plus,
  Search,
} from "lucide-react";
import {
  dashboardPageHeaderCtaClassName,
  dashboardPageHeaderCtaSecondaryClassName,
  dashboardPageHeaderDescriptionClassName,
  dashboardPageHeaderTitleClassName,
} from "@/components/dashboard/dashboard-page-header";
import {
  CollabAvatar,
  CollabEmptyState,
  CollabFilterTab,
  CollabLoadingState,
  CollabMetricStrip,
  CollabPageShell,
  CollabStatusDot,
  CollabSurface,
} from "@/components/collaborations/collab-ui";
import { CreateCollaborationModal } from "@/components/collaborations/create-collaboration-modal";
import { CollabWorkspaceCard } from "@/components/collaborations/collab-workspace-card";
import { FeatureUpgradeButton } from "@/components/billing/plan-upgrade-modal";
import { useToast } from "@/components/toast-provider";
import {
  collaborationRoleLabel,
  listCollaborations,
  listPendingCollaborationInvites,
  type CollaborationWorkspace,
  type PendingCollaborationInvite,
} from "@/lib/collaborations-api";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";

type FilterKey = "all" | "active" | "archived" | "owned";

export default function CollaborationsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { can, openUpgrade, plan } = usePlanEntitlements();
  const canCollaborate = can("collaboration");
  const maxSeats = plan?.maxTeamMembers ?? 0;

  const [workspaces, setWorkspaces] = useState<CollaborationWorkspace[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingCollaborationInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, pending] = await Promise.all([
        listCollaborations({ limit: 100 }),
        listPendingCollaborationInvites().catch(() => ({
          invites: [] as PendingCollaborationInvite[],
        })),
      ]);
      setWorkspaces(list.workspaces);
      setPendingInvites(pending.invites.filter((i) => !i.expired));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreateWorkspace() {
    if (!canCollaborate) {
      openUpgrade({
        feature: "collaboration",
        message: "Team collaboration is available on the Premium plan.",
        requiredPlans: ["premium"],
        suggestedPlanId: "premium",
      });
      return;
    }
    setCreateOpen(true);
  }

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    router.replace("/collaborations", { scroll: false });
    openCreateWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once from ?new=1; keep deps length stable
  }, [searchParams, router]);

  const pendingCount = pendingInvites.length;
  const activeCount = workspaces.filter((w) => w.status === "active").length;
  const archivedCount = workspaces.filter((w) => w.status === "archived").length;
  const ownedCount = workspaces.filter((w) => w.role === "owner").length;
  const totalMembers = workspaces.reduce((sum, w) => sum + (w.memberCount || 0), 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workspaces
      .filter((ws) => {
        if (filter === "active") return ws.status === "active";
        if (filter === "archived") return ws.status === "archived";
        if (filter === "owned") return ws.role === "owner";
        return true;
      })
      .filter((ws) => {
        if (!q) return true;
        return (
          ws.name.toLowerCase().includes(q) ||
          (ws.description ?? "").toLowerCase().includes(q) ||
          (ws.owner?.name ?? "").toLowerCase().includes(q) ||
          (ws.owner?.email ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const at = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bt - at;
      });
  }, [workspaces, filter, query]);

  return (
    <CollabPageShell>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm">
              <li>
                <Link
                  href="/dashboard"
                  className="font-medium text-zinc-400 transition hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  Dashboard
                </Link>
              </li>
              <li className="text-zinc-300 dark:text-zinc-600" aria-hidden>
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
              </li>
              <li className="font-semibold text-zinc-900 dark:text-zinc-50">
                Collaborations
              </li>
            </ol>
          </nav>
          <h1 className={dashboardPageHeaderTitleClassName("mt-2")}>Collaborations</h1>
          <p className={dashboardPageHeaderDescriptionClassName()}>
            Shared shoots with second shooters and editors — client galleries stay separate.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/collaborations/invites"
            className={dashboardPageHeaderCtaSecondaryClassName("inline-flex items-center gap-2")}
          >
            <Inbox className="h-4 w-4" aria-hidden />
            Invites
            {pendingCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">
                {pendingCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={openCreateWorkspace}
            className={dashboardPageHeaderCtaClassName("inline-flex items-center gap-2")}
          >
            <Plus className="h-4 w-4" aria-hidden />
            New workspace
          </button>
        </div>
      </header>

      {!loading && !error ? (
        <CollabMetricStrip
          items={[
            {
              label: "Active",
              value: activeCount,
              hint: archivedCount > 0 ? `${archivedCount} archived` : "Open workspaces",
              highlight: true,
            },
            {
              label: "Pending invites",
              value: pendingCount,
              hint: pendingCount > 0 ? "Awaiting response" : "All caught up",
            },
            {
              label: "You own",
              value: ownedCount,
              hint: `${workspaces.length} total`,
            },
            {
              label: "People",
              value: totalMembers,
              hint: maxSeats > 0 ? `Up to ${maxSeats} seats` : "Across workspaces",
            },
          ]}
        />
      ) : null}

      {!canCollaborate ? (
        <CollabSurface className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Creating workspaces requires Premium
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              You can still open workspaces you&apos;ve been invited to.
              {maxSeats > 0 ? ` Your plan includes ${maxSeats} team seats.` : null}
            </p>
          </div>
          <FeatureUpgradeButton
            feature="collaboration"
            label="Upgrade to Premium"
            suggestedPlanId="premium"
          />
        </CollabSurface>
      ) : null}

      {pendingCount > 0 ? (
        <CollabSurface className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <CollabStatusDot status="pending" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                Needs attention
              </p>
            </div>
            <Link
              href="/collaborations/invites"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline dark:text-brand-on-dark"
            >
              Review all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {pendingInvites.slice(0, 3).map((invite) => (
              <li
                key={`${invite.workspace.id}-${invite.member.id}`}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <CollabAvatar
                    name={
                      invite.workspace.owner?.name ||
                      invite.workspace.owner?.email ||
                      invite.workspace.name
                    }
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {invite.workspace.name}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      From{" "}
                      {invite.workspace.owner?.name ||
                        invite.workspace.owner?.email ||
                        "a studio"}{" "}
                      · {collaborationRoleLabel(invite.member.role)}
                    </p>
                  </div>
                </div>
                <Link
                  href="/collaborations/invites"
                  className={dashboardPageHeaderCtaSecondaryClassName("shrink-0 text-xs")}
                >
                  Respond
                </Link>
              </li>
            ))}
          </ul>
        </CollabSurface>
      ) : null}

      {loading ? (
        <CollabLoadingState label="Loading workspaces…" />
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => {
              void load().catch((err) =>
                showToast(err instanceof Error ? err.message : "Retry failed", "error"),
              );
            }}
          >
            Retry
          </button>
        </div>
      ) : workspaces.length === 0 ? (
        <CollabEmptyState
          icon={<FolderKanban className="h-5 w-5" aria-hidden />}
          title="No workspaces yet"
          description={
            canCollaborate
              ? "Create a workspace to share shoots with your team — uploads stay separate from client galleries."
              : "When someone invites you, it will show up here. Or upgrade to Premium to create your own."
          }
          action={
            canCollaborate ? (
              <button
                type="button"
                onClick={openCreateWorkspace}
                className={dashboardPageHeaderCtaClassName("inline-flex items-center gap-2")}
              >
                <Plus className="h-4 w-4" aria-hidden />
                New workspace
              </button>
            ) : (
              <FeatureUpgradeButton
                feature="collaboration"
                label="Upgrade to Premium"
                suggestedPlanId="premium"
                className={dashboardPageHeaderCtaClassName()}
              />
            )
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1">
              <CollabFilterTab
                active={filter === "all"}
                onClick={() => setFilter("all")}
                count={workspaces.length}
              >
                All
              </CollabFilterTab>
              <CollabFilterTab
                active={filter === "active"}
                onClick={() => setFilter("active")}
                count={activeCount}
              >
                Active
              </CollabFilterTab>
              <CollabFilterTab
                active={filter === "owned"}
                onClick={() => setFilter("owned")}
                count={ownedCount}
              >
                Owned
              </CollabFilterTab>
              {archivedCount > 0 ? (
                <CollabFilterTab
                  active={filter === "archived"}
                  onClick={() => setFilter("archived")}
                  count={archivedCount}
                >
                  Archived
                </CollabFilterTab>
              ) : null}
            </div>
            <label className="relative block w-full sm:w-52">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
                aria-hidden
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
          </div>

          {filtered.length === 0 ? (
            <CollabEmptyState
              icon={<Search className="h-5 w-5" aria-hidden />}
              title="No matches"
              description="Try another filter or search term."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((ws) => (
                <li key={ws.id}>
                  <CollabWorkspaceCard workspace={ws} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <CreateCollaborationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={(workspace) => {
          setWorkspaces((prev) => {
            if (prev.some((w) => w.id === workspace.id)) return prev;
            return [workspace, ...prev];
          });
        }}
      />
    </CollabPageShell>
  );
}
