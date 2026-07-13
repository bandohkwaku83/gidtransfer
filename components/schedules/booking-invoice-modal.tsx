"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";
import { Download, FileText, Mail, Plus, Share2, Trash2 } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import type { BookedShoot } from "@/components/schedules/booking-types";
import { formatBookedTimeLabel } from "@/components/schedules/booking-types";
import { FormInput } from "@/components/ui/form-input";
import {
  FormModal,
  FormModalBody,
  FormModalHeader,
  formModalCancelButtonClass,
  formModalPrimaryButtonClass,
  formModalSecondaryButtonClass,
} from "@/components/ui/form-modal";
import { getAuth } from "@/lib/auth-demo";
import { parseAmountChargedInput } from "@/lib/booking-amount";
import { formatBookingAmount } from "@/lib/bookings-api";
import {
  buildBookingInvoiceData,
  buildInvoiceMailtoUrl,
  downloadBookingInvoicePdf,
  formatInvoiceDate,
  shareBookingInvoicePdf,
  studioFromProfile,
  type BookingInvoiceData,
} from "@/lib/booking-invoice";
import { getBooking } from "@/lib/bookings-api";
import { recordBookingInvoice } from "@/lib/income-api";
import { onboardingAntInputClassName } from "@/lib/onboarding-field-styles";
import { studioLogoSrc } from "@/lib/branding";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  booking: BookedShoot | null;
  onClose: () => void;
};

type EditableAddOn = {
  id: string;
  label: string;
  amountInput: string;
};

const ADD_ON_SUGGESTIONS = ["Transport", "Extra hour", "Retouching", "Print package", "Rush fee"];

function newAddOn(partial?: Partial<EditableAddOn>): EditableAddOn {
  return {
    id: crypto.randomUUID(),
    label: "",
    amountInput: "",
    ...partial,
  };
}

function parseAddOns(addOns: EditableAddOn[]) {
  return addOns
    .map((item) => {
      const label = item.label.trim();
      const amount = parseAmountChargedInput(item.amountInput);
      if (!label || amount == null || amount <= 0) return null;
      return { label, amount };
    })
    .filter((item): item is { label: string; amount: number } => item != null);
}

function InvoicePreview({ data }: { data: BookingInvoiceData }) {
  const logoSrc = studioLogoSrc(data.studio.logoDataUrl);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white font-sans shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden">
              <Image
                src={logoSrc}
                alt=""
                width={44}
                height={44}
                unoptimized={logoSrc.startsWith("data:")}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate font-serif text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {data.studio.companyName}
              </p>
              <div className="mt-1 space-y-0.5 text-xs text-zinc-500">
                {data.studio.email ? <p>{data.studio.email}</p> : null}
                {data.studio.phone ? <p>{data.studio.phone}</p> : null}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-serif text-3xl text-zinc-900 dark:text-zinc-50">Invoice</p>
            <p className="mt-1 text-[11px] text-zinc-500">{data.invoiceNumber}</p>
            <p className="text-[11px] text-zinc-500">Issued {formatInvoiceDate(data.issuedOn)}</p>
            <p className="text-[11px] text-zinc-500">Due {formatInvoiceDate(data.dueOn)}</p>
          </div>
        </div>
        <div className="mt-5 h-0.5 bg-brand" />
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Bill to</p>
            <p className="mt-1 font-serif text-base font-bold text-zinc-900 dark:text-zinc-50">
              {data.client.name}
            </p>
            {data.client.email ? (
              <p className="mt-0.5 text-xs text-zinc-500">{data.client.email}</p>
            ) : (
              <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                No email on file — add one to send directly.
              </p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Amount due
            </p>
            <p className="mt-1 font-serif text-2xl font-bold text-brand dark:text-brand-on-dark">
              {formatBookingAmount(data.total, data.currency)}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-100 dark:border-zinc-800">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 bg-zinc-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            <span>Description</span>
            <span className="w-8 text-center">Qty</span>
            <span className="min-w-[4.5rem] text-right">Amount</span>
          </div>
          {data.lineItems.map((item, index) => (
            <div
              key={`${item.description}-${index}`}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-t border-zinc-100 px-3 py-3 dark:border-zinc-800"
            >
              <div className="min-w-0">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.description}</p>
                {item.detail ? (
                  <p className="mt-0.5 text-xs text-zinc-500">{item.detail}</p>
                ) : null}
              </div>
              <p className="w-8 text-center text-sm text-zinc-600 dark:text-zinc-300">
                {item.quantity}
              </p>
              <p className="min-w-[4.5rem] text-right font-medium text-zinc-900 dark:text-zinc-50">
                {formatBookingAmount(item.total, data.currency)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-end justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {data.lineItems.length > 1 ? (
            <p className="text-sm text-zinc-500">
              Subtotal {formatBookingAmount(data.subtotal, data.currency)}
            </p>
          ) : (
            <span />
          )}
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Total due</p>
            <p className="font-serif text-xl font-bold text-brand dark:text-brand-on-dark">
              {formatBookingAmount(data.total, data.currency)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500 dark:border-zinc-800">
        <span>Thank you for your business.</span>
        <span className="font-serif text-zinc-700 dark:text-zinc-300">{data.studio.companyName}</span>
      </div>
    </div>
  );
}

export function BookingInvoiceModal({ open, booking, onClose }: Props) {
  const titleId = useId();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [clientLocation, setClientLocation] = useState("");
  const [addOns, setAddOns] = useState<EditableAddOn[]>([]);

  useEffect(() => {
    if (!open || !booking?.id) return;
    let cancelled = false;
    setClientEmail("");
    setClientContact("");
    setClientLocation("");
    setAddOns([]);

    void (async () => {
      try {
        const apiBooking = await getBooking(booking.id);
        if (cancelled) return;
        const client = apiBooking.client;
        setClientEmail(client?.email?.trim() ?? "");
        setClientContact(client?.contact?.trim() ?? "");
        setClientLocation(client?.location?.trim() ?? "");
      } catch {
        if (!cancelled) {
          showToast("Could not load client details for the invoice.", "error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, booking?.id, showToast]);

  const invoiceData = useMemo(() => {
    if (!booking) return null;
    const auth = getAuth();
    const studio = studioFromProfile(auth?.user?.studio, auth?.user?.email ?? auth?.email);
    return buildBookingInvoiceData(
      booking,
      {
        name: booking.clientName,
        email: clientEmail || undefined,
        contact: clientContact || undefined,
        location: clientLocation || undefined,
      },
      studio,
      { addOns: parseAddOns(addOns) },
    );
  }, [booking, clientEmail, clientContact, clientLocation, addOns]);

  const hasAmount = Boolean(booking?.amountCharged && booking.amountCharged > 0);
  const canEmail = Boolean(clientEmail.trim());
  const canNativeShare =
    typeof navigator !== "undefined" && "share" in navigator && typeof navigator.share === "function";

  function updateAddOn(id: string, patch: Partial<EditableAddOn>) {
    setAddOns((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeAddOn(id: string) {
    setAddOns((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleDownload() {
    if (!invoiceData) return;
    setBusy(true);
    try {
      await syncInvoiceToIncome(invoiceData);
      await downloadBookingInvoicePdf(invoiceData);
      showToast("Invoice recorded and PDF downloaded.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not create PDF.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleSend() {
    if (!invoiceData) return;
    if (!canEmail) {
      showToast("Add a client email before sending the invoice.", "error");
      return;
    }
    setBusy(true);
    try {
      await syncInvoiceToIncome(invoiceData);
      const result = await shareBookingInvoicePdf(invoiceData);
      if (result === "shared") {
        showToast("Invoice recorded and shared.", "success");
      } else if (result === "mailto") {
        showToast("Invoice recorded — attach the PDF in your email app.", "success");
      } else {
        showToast("Invoice recorded and PDF downloaded.", "success");
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      const mailto = buildInvoiceMailtoUrl(invoiceData);
      if (mailto) {
        try {
          await downloadBookingInvoicePdf(invoiceData);
          window.location.href = mailto;
          showToast("Invoice recorded — attach the PDF in your email app.", "success");
        } catch {
          showToast("Could not send invoice.", "error");
        }
      } else {
        showToast(e instanceof Error ? e.message : "Could not send invoice.", "error");
      }
    } finally {
      setBusy(false);
    }
  }

  function handleClose() {
    if (busy) return;
    onClose();
  }

  async function syncInvoiceToIncome(data: BookingInvoiceData) {
    const addOns =
      data.lineItems.length > 1
        ? data.lineItems.slice(1).map((item) => ({
            label: item.description,
            amount: item.total,
          }))
        : [];

    await recordBookingInvoice(data.booking.id, {
      issuedOn: data.issuedOn,
      addOns,
      amountPaying: 0,
    });
  }

  if (!open || !booking || !invoiceData) return null;

  return (
    <FormModal open={open} onClose={handleClose} busy={busy} maxWidth="lg" titleId={titleId}>
      <FormModalHeader
        icon={FileText}
        title="Booking invoice"
        description="Add line items, preview the invoice, then download or send a PDF to your client."
      />
      <FormModalBody className="space-y-5">
        {!hasAmount ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            This booking has no base fee set. Add-ons will still appear on the invoice.
          </p>
        ) : null}

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Add-ons</h3>
              <p className="text-xs text-zinc-500">
                Transport, extras, or any additional charges for this shoot.
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => setAddOns((prev) => [...prev, newAddOn()])}
              className={formModalSecondaryButtonClass}
            >
              <Plus className="h-3.5 w-3.5 shrink-0 text-brand dark:text-brand-on-dark" aria-hidden />
              Add line
            </button>
          </div>

          {addOns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-4 dark:border-zinc-700 dark:bg-zinc-900/40">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">No add-ons yet.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ADD_ON_SUGGESTIONS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    disabled={busy}
                    onClick={() => setAddOns((prev) => [...prev, newAddOn({ label })])}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-brand hover:text-brand disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    + {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {addOns.map((item) => (
                <li
                  key={item.id}
                  className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_140px_auto] dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <FormInput
                    className={onboardingAntInputClassName}
                    value={item.label}
                    onChange={(e) => updateAddOn(item.id, { label: e.target.value })}
                    placeholder="e.g. Transport, extra hour"
                    disabled={busy}
                    aria-label="Add-on description"
                  />
                  <FormInput
                    className={onboardingAntInputClassName}
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={item.amountInput}
                    onChange={(e) => updateAddOn(item.id, { amountInput: e.target.value })}
                    placeholder="Amount"
                    disabled={busy}
                    aria-label="Add-on amount"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => removeAddOn(item.id)}
                    className="inline-flex h-10 w-10 items-center justify-center self-end rounded-lg border border-zinc-200 text-zinc-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-zinc-700 dark:hover:border-red-900/50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    aria-label="Remove add-on"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setAddOns((prev) => [...prev, newAddOn()])}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand transition hover:underline disabled:opacity-50 dark:text-brand-on-dark"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Add another line
                </button>
              </li>
            </ul>
          )}
        </section>

        <InvoicePreview data={invoiceData} />
      </FormModalBody>
      <div className="flex flex-col-reverse gap-2 border-t border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <button type="button" className={formModalCancelButtonClass} onClick={handleClose} disabled={busy}>
          Close
        </button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleDownload()}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900",
            )}
          >
            <Download className="h-4 w-4" aria-hidden />
            Download PDF
          </button>
          <button
            type="button"
            disabled={busy || !canEmail}
            title={!canEmail ? "Add a client email to send" : undefined}
            onClick={() => void handleSend()}
            className={cn(formModalPrimaryButtonClass, "inline-flex items-center justify-center gap-2")}
          >
            {canNativeShare ? (
              <Share2 className="h-4 w-4" aria-hidden />
            ) : (
              <Mail className="h-4 w-4" aria-hidden />
            )}
            {canNativeShare ? "Share invoice" : "Email invoice"}
          </button>
        </div>
      </div>
    </FormModal>
  );
}
