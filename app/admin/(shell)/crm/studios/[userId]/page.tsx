"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { getCrmStudio } from "@/lib/admin/crm";
import { getErrorMessage } from "@/lib/admin/admin-client";
import type { CrmStudioDetail } from "@/lib/admin/types";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { formatDateTime } from "@/lib/admin/format";
import { useToast } from "@/lib/admin/use-admin-toast";

export default function CrmStudioDetailPage() {
  const router = useRouter();
  const { userId } = useParams<{ userId: string }>();
  const { toast } = useToast();
  const [detail, setDetail] = useState<CrmStudioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [piiOpen, setPiiOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = (opts: { includePii?: boolean; reason?: string } = {}) => {
    setLoading(true);
    getCrmStudio(userId, opts)
      .then((data) => {
        setDetail(data);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [userId]);

  const revealPii = async () => {
    if (reason.trim().length < 3) {
      toast("Reason is required (min 3 characters)", "error");
      return;
    }
    setActionLoading(true);
    try {
      const data = await getCrmStudio(userId, {
        includePii: true,
        reason: reason.trim(),
      });
      setDetail(data);
      toast("PII revealed — access is audited");
      setPiiOpen(false);
      setReason("");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !detail) {
    return <div className="h-64 animate-pulse rounded-xl bg-zinc-200" />;
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.push("/admin/crm")}
        >
          Back
        </button>
        <p className="text-sm text-red-600">{error || "Studio not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
        onClick={() => router.push("/admin/crm")}
      >
        <ArrowLeft className="h-4 w-4" /> Back to CRM
      </button>

      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {detail.studio.companyName || "Studio"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{detail.studio.email}</p>
            <div className="mt-3 flex gap-4 text-sm">
              <Link
                href={`/admin/photographers/${detail.studio.userId}`}
                className="text-primary hover:underline"
              >
                Photographer profile
              </Link>
              <Link
                href={`/admin/crm/bookings?ownerId=${detail.studio.userId}`}
                className="text-primary hover:underline"
              >
                Bookings
              </Link>
            </div>
          </div>
          {!detail.includePii && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setPiiOpen(true)}
            >
              <Eye className="mr-1.5 inline h-4 w-4" />
              Reveal client PII
            </button>
          )}
        </div>

        {detail.includePii && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Client PII is visible for this session response. Do not copy into
            local storage or external tools without need.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs text-slate-400">Clients</p>
          <p className="mt-1 text-2xl font-semibold">{detail.totals.clients}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400">Upcoming bookings</p>
          <p className="mt-1 text-2xl font-semibold">
            {detail.totals.upcomingBookings}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400">Bookings this month</p>
          <p className="mt-1 text-2xl font-semibold">
            {detail.totals.bookingsThisMonth}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Recent clients
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {detail.recentClients.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              No clients yet
            </p>
          ) : (
            detail.recentClients.map((client) => (
              <div key={client.id} className="px-5 py-3 text-sm">
                <p className="font-medium text-slate-900">{client.name}</p>
                {detail.includePii ? (
                  <p className="mt-1 text-slate-500">
                    {[client.email, client.phone, client.location]
                      .filter(Boolean)
                      .join(" · ") || "No contact details"}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">
                    Contact hidden — reveal PII to view
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {formatDateTime(client.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={piiOpen}
        title="Reveal client PII"
        description={
          <div className="space-y-3">
            <p>
              Access is logged with your admin email, role, and reason. Only
              request PII when needed for support.
            </p>
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="e.g. Support ticket 123"
              />
            </div>
          </div>
        }
        confirmLabel="Reveal PII"
        loading={actionLoading}
        onConfirm={revealPii}
        onCancel={() => {
          setPiiOpen(false);
          setReason("");
        }}
      />
    </div>
  );
}
