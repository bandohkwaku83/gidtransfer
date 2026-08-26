"use client";

import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";
import {
  CollabAvatar,
  CollabStatusDot,
  formatCollabRelative,
} from "@/components/collaborations/collab-ui";
import {
  collaborationRoleLabel,
  type CollaborationWorkspace,
} from "@/lib/collaborations-api";
import { cn } from "@/lib/utils";

export function CollabWorkspaceCard({
  workspace,
}: {
  workspace: CollaborationWorkspace;
}) {
  const ownerLabel =
    workspace.owner?.name || workspace.owner?.email || "Owner";
  const monogram = (workspace.name.trim().charAt(0) || "W").toUpperCase();
  const isArchived = workspace.status === "archived";

  return (
    <Link
      href={`/collaborations/${workspace.id}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 transition duration-200",
        "hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_12px_28px_-20px_rgba(15,23,42,0.3)]",
        "dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:shadow-none",
      )}
    >
      <div className="flex items-start gap-3.5">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-base font-semibold",
            isArchived
              ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              : "bg-brand text-white",
          )}
        >
          {monogram}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate font-display text-lg font-semibold tracking-tight text-zinc-900 group-hover:text-brand dark:text-zinc-50 dark:group-hover:text-brand-on-dark">
              {workspace.name}
            </h2>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center text-zinc-300 opacity-0 transition group-hover:opacity-100 dark:text-zinc-600">
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </span>
          </div>

          {isArchived ? (
            <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
              <CollabStatusDot status="archived" />
              Archived
            </div>
          ) : null}

          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {workspace.description?.trim() || "No description yet"}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-100 pt-3.5 dark:border-zinc-800">
        <div className="flex min-w-0 items-center gap-2.5">
          <CollabAvatar name={ownerLabel} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
              {ownerLabel}
            </p>
            <p className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
              <Users className="h-3 w-3" aria-hidden />
              {workspace.memberCount}{" "}
              {workspace.memberCount === 1 ? "member" : "members"}
              <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>
                ·
              </span>
              {collaborationRoleLabel(workspace.role)}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-zinc-400">
          {formatCollabRelative(workspace.updatedAt)}
        </span>
      </div>
    </Link>
  );
}
