"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { Check, Users, X } from "lucide-react";
import { DashboardSpin } from "@/components/ui/skeletons";
import {
  dashboardPageHeaderCtaClassName,
  dashboardPageHeaderCtaSecondaryClassName,
  dashboardPageHeaderDescriptionClassName,
  dashboardPageHeaderTitleClassName,
} from "@/components/dashboard/dashboard-page-header";
import {
  CollabPageShell,
  CollabSurface,
} from "@/components/collaborations/collab-ui";
import { useToast } from "@/components/toast-provider";
import {
  acceptCollaborationInviteByToken,
  declineCollaborationInviteByToken,
} from "@/lib/collaborations-api";

export default function CollaborationInviteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onAccept() {
    setBusy("accept");
    setError(null);
    try {
      const res = await acceptCollaborationInviteByToken(token);
      setDone("accepted");
      showToast(res.message ?? "Invite accepted.", "success");
      router.replace(`/collaborations/${res.workspace.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept invite.");
    } finally {
      setBusy(null);
    }
  }

  async function onDecline() {
    setBusy("decline");
    setError(null);
    try {
      const res = await declineCollaborationInviteByToken(token);
      setDone("declined");
      showToast(res.message ?? "Invite declined.", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not decline invite.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <CollabPageShell narrow className="pt-4 sm:pt-8">
      <CollabSurface className="overflow-hidden">
        <div className="border-b border-zinc-100 bg-brand-soft/50 px-4 py-6 dark:border-zinc-800 dark:bg-brand/10">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
            <Users className="h-5 w-5" aria-hidden />
          </span>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-brand-ink dark:text-brand-on-dark">
            Collaboration invite
          </p>
          <h1 className={dashboardPageHeaderTitleClassName("mt-1.5 text-[1.5rem] sm:text-[1.65rem]")}>
            Join workspace
          </h1>
          <p className={dashboardPageHeaderDescriptionClassName()}>
            You&apos;ve been invited to a shared photography workspace. Accept to start
            collaborating, or decline if this wasn&apos;t meant for you.
          </p>
        </div>

        <div className="px-4 py-5">
          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}

          {done === "declined" ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">Invite declined.</p>
              <Link
                href="/collaborations"
                className={dashboardPageHeaderCtaClassName("inline-flex")}
              >
                Go to collaborations
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy != null}
                onClick={() => void onAccept()}
                className={dashboardPageHeaderCtaClassName("inline-flex items-center gap-2")}
              >
                {busy === "accept" ? (
                  <DashboardSpin size="small" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden />
                )}
                Accept invite
              </button>
              <button
                type="button"
                disabled={busy != null}
                onClick={() => void onDecline()}
                className={dashboardPageHeaderCtaSecondaryClassName(
                  "inline-flex items-center gap-2",
                )}
              >
                {busy === "decline" ? (
                  <DashboardSpin size="small" />
                ) : (
                  <X className="h-4 w-4" aria-hidden />
                )}
                Decline
              </button>
            </div>
          )}
        </div>
      </CollabSurface>
    </CollabPageShell>
  );
}
