"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getBillingPlans,
  updateBillingPlan,
} from "@/lib/admin/billing";
import { getErrorMessage } from "@/lib/admin/admin-client";
import type { BillingPlan } from "@/lib/admin/types";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { useToast } from "@/lib/admin/use-admin-toast";

export default function BillingPlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<BillingPlan | null>(null);
  const [draft, setDraft] = useState({
    priceGhs: "",
    storageGb: "",
    maxGalleries: "",
    description: "",
    perks: "",
    reason: "",
  });
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    setLoading(true);
    getBillingPlans()
      .then((data) => {
        setPlans(data);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (plan: BillingPlan) => {
    setEditing(plan);
    setDraft({
      priceGhs: String(plan.priceGhs ?? 0),
      storageGb: String(
        Math.round((plan.storageLimitBytes || 0) / (1024 * 1024 * 1024)),
      ),
      maxGalleries:
        plan.maxGalleries == null ? "" : String(plan.maxGalleries),
      description: plan.description ?? "",
      perks: (plan.perks ?? []).join("\n"),
      reason: "",
    });
  };

  const savePlan = async () => {
    if (!editing || draft.reason.trim().length < 3) {
      toast("Reason is required (min 3 characters)", "error");
      return;
    }
    setActionLoading(true);
    try {
      const storageGb = Number(draft.storageGb);
      const priceGhs = Number(draft.priceGhs);
      const maxRaw = draft.maxGalleries.trim();
      await updateBillingPlan(editing.id, {
        reason: draft.reason.trim(),
        description: draft.description,
        priceGhs: Number.isFinite(priceGhs) ? priceGhs : undefined,
        storageLimitBytes: Number.isFinite(storageGb)
          ? Math.round(storageGb * 1024 * 1024 * 1024)
          : undefined,
        maxGalleries: maxRaw === "" ? null : Number(maxRaw),
        perks: draft.perks
          .split("\n")
          .map((p) => p.trim())
          .filter(Boolean),
      });
      toast("Plan updated");
      setEditing(null);
      load();
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing plans"
        description="Platform plan catalog (free, starter, pro, studio)"
        action={
          <Link href="/admin/billing/events" className="btn-secondary">
            Billing events
          </Link>
        }
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-zinc-200" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <div key={plan.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-xs font-mono text-slate-400">
                    {plan.id}
                  </p>
                </div>
                {!plan.available && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                    Unavailable
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-slate-600">{plan.description}</p>
              <div className="mt-4 space-y-1 text-sm">
                <p>
                  <span className="text-slate-400">Price:</span>{" "}
                  {plan.priceGhs === 0
                    ? "Free"
                    : `GHS ${plan.priceGhs}${plan.interval ? ` / ${plan.interval}` : ""}`}
                </p>
                <p>
                  <span className="text-slate-400">Storage:</span>{" "}
                  {plan.storageLabel}
                </p>
                <p>
                  <span className="text-slate-400">Galleries:</span>{" "}
                  {plan.maxGalleries == null ? "Unlimited" : plan.maxGalleries}
                </p>
              </div>
              {plan.perks?.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-slate-500">
                  {plan.perks.map((perk) => (
                    <li key={perk}>• {perk}</li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="btn-secondary mt-auto pt-4"
                onClick={() => openEdit(plan)}
              >
                Edit plan
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!editing}
        title={`Edit ${editing?.name ?? "plan"}`}
        description={
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium">Price (GHS)</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                value={draft.priceGhs}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, priceGhs: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Storage (GB)</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                value={draft.storageGb}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, storageGb: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Max galleries (blank = unlimited)
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                value={draft.maxGalleries}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, maxGalleries: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                rows={2}
                value={draft.description}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, description: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Perks (one per line)
              </label>
              <textarea
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                rows={4}
                value={draft.perks}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, perks: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Reason</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                rows={2}
                value={draft.reason}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, reason: e.target.value }))
                }
              />
            </div>
          </div>
        }
        confirmLabel="Save plan"
        loading={actionLoading}
        onConfirm={savePlan}
        onCancel={() => setEditing(null)}
      />
    </div>
  );
}
