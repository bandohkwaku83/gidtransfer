"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Tag } from "antd";
import { Banknote, UserPlus } from "lucide-react";
import { CreateClientModal } from "@/components/photographer/create-client-modal";
import { useToast } from "@/components/toast-provider";
import { ClientSearchSelect } from "@/components/ui/client-search-select";
import { FormDatePicker } from "@/components/ui/form-date-picker";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { FormShootTypeSelect } from "@/components/ui/form-shoot-type-select";
import {
  FormField,
  FormModal,
  FormModalBody,
  FormModalForm,
  FormModalHeader,
  FormModalOnboardingFooter,
  FormModalSection,
  formModalSecondaryButtonClass,
} from "@/components/ui/form-modal";
import {
  formatAmountChargedInput,
  parseAmountChargedInput,
} from "@/lib/booking-amount";
import {
  formatBookingAmount,
  getBookingsMeta,
  listBookings,
  type ApiBooking,
  type BookingShootTypeMeta,
} from "@/lib/bookings-api";
import {
  FALLBACK_SHOOT_TYPES,
  findShootTypeMeta,
  resolveShootCategoryFromApi,
} from "@/lib/booking-shoot-types";
import { listClients, type ApiClient } from "@/lib/clients-api";
import {
  deriveIncomeStatus,
  incomePaymentPercent,
  incomeStatusLabel,
  type IncomeEntry,
  type IncomeStatus,
} from "@/lib/income-demo";
import { createIncome, updateIncome } from "@/lib/income-api";

type Props = {
  open: boolean;
  onClose: () => void;
  entry?: IncomeEntry | null;
  onSaved?: (entry: IncomeEntry) => void;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateInputFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return todayIsoDate();
  return d.toISOString().slice(0, 10);
}

function defaultShootCategory(shootTypes: BookingShootTypeMeta[]): string {
  return (
    findShootTypeMeta(shootTypes, "portraits")?.id ??
    findShootTypeMeta(shootTypes, "wedding")?.id ??
    shootTypes[0]?.id ??
    "other"
  );
}

function resolveShootCategoryFromLabel(
  shootTypes: BookingShootTypeMeta[],
  label: string,
): string {
  const trimmed = label.trim();
  if (!trimmed) return defaultShootCategory(shootTypes);
  const fromLabel = shootTypes.find(
    (type) => type.label.toLowerCase() === trimmed.toLowerCase(),
  );
  if (fromLabel) return fromLabel.id;
  const fromId = findShootTypeMeta(shootTypes, trimmed);
  return fromId?.id ?? defaultShootCategory(shootTypes);
}

function resolveClientId(entry: IncomeEntry | null | undefined, clients: ApiClient[]): string {
  if (!entry) return "";
  if (entry.clientId && clients.some((client) => client._id === entry.clientId)) {
    return entry.clientId;
  }
  const byName = clients.find(
    (client) => client.name.trim().toLowerCase() === entry.clientName.trim().toLowerCase(),
  );
  return byName?._id ?? entry.clientId ?? "";
}

async function loadRecentBookings(): Promise<ApiBooking[]> {
  const now = new Date();
  const requests = Array.from({ length: 6 }, (_, index) => {
    const d = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return listBookings({ year: d.getFullYear(), month: d.getMonth() + 1 });
  });
  const results = await Promise.allSettled(requests);
  const byId = new Map<string, ApiBooking>();
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const booking of result.value?.bookings ?? []) {
      byId.set(booking._id, booking);
    }
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
  );
}

function statusTagColor(status: IncomeStatus): string {
  switch (status) {
    case "paid":
      return "success";
    case "pending":
      return "default";
    case "partial":
      return "warning";
    case "invoiced":
      return "processing";
  }
}

export function IncomeEntryModal({ open, onClose, entry, onSaved }: Props) {
  const { showToast } = useToast();
  const formId = useId();
  const isEdit = Boolean(entry?.id);

  const [bookingId, setBookingId] = useState("");
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [shootCategory, setShootCategory] = useState("");
  const [totalAmountInput, setTotalAmountInput] = useState("");
  const [amountPayingInput, setAmountPayingInput] = useState("");
  const [date, setDate] = useState(todayIsoDate());
  const [busy, setBusy] = useState(false);

  const [clients, setClients] = useState<ApiClient[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [shootTypes, setShootTypes] = useState<BookingShootTypeMeta[]>(FALLBACK_SHOOT_TYPES);
  const [shootTypesLoading, setShootTypesLoading] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);

  const resolvedShootTypes = useMemo(
    () => (shootTypes.length > 0 ? shootTypes : FALLBACK_SHOOT_TYPES),
    [shootTypes],
  );

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name)),
    [clients],
  );

  const clientsForSelect = useMemo(() => {
    const selectedId = clientId || entry?.clientId;
    if (!selectedId) return sortedClients;
    if (sortedClients.some((client) => client._id === selectedId)) return sortedClients;
    const fallbackName = entry?.clientName?.trim();
    if (!fallbackName) return sortedClients;
    return [
      ...sortedClients,
      {
        _id: selectedId,
        name: fallbackName,
        email: "",
        contact: "",
        location: "",
      },
    ];
  }, [sortedClients, clientId, entry?.clientId, entry?.clientName]);

  const bookingOptions = useMemo(
    () =>
      bookings.map((booking) => {
        const clientName = booking.client?.name?.trim() || "No client";
        const amountLabel = formatBookingAmount(booking.amountCharged, booking.currency ?? "GHS");
        const suffix = amountLabel ? ` · ${amountLabel}` : "";
        return {
          value: booking._id,
          label: `${booking.title} — ${clientName}${suffix}`,
        };
      }),
    [bookings],
  );

  const parsedTotal = parseAmountChargedInput(totalAmountInput);
  const parsedPaying = parseAmountChargedInput(amountPayingInput);
  const previewStatus = deriveIncomeStatus(parsedTotal ?? 0, parsedPaying ?? 0);
  const previewPercent = incomePaymentPercent(parsedTotal ?? 0, parsedPaying ?? 0);

  useEffect(() => {
    if (!open) return;

    setBookingId(entry?.bookingId ?? "");
    setTitle(entry?.title ?? "");
    setTotalAmountInput(formatAmountChargedInput(entry?.totalAmount));
    setAmountPayingInput(formatAmountChargedInput(entry?.amountPaying));
    setDate(dateInputFromIso(entry?.date ?? new Date().toISOString()));
    setBusy(false);
    setAddClientOpen(false);

    let cancelled = false;
    setClientsLoading(true);
    setBookingsLoading(true);
    setShootTypesLoading(true);

    void (async () => {
      try {
        const [clientsRes, meta, recentBookings] = await Promise.all([
          listClients(""),
          getBookingsMeta(),
          loadRecentBookings(),
        ]);
        if (cancelled) return;

        const loadedShootTypes =
          meta.shootTypes.length > 0 ? meta.shootTypes : FALLBACK_SHOOT_TYPES;
        setClients(clientsRes.clients);
        setBookings(recentBookings);
        setShootTypes(loadedShootTypes);
        setClientId(resolveClientId(entry, clientsRes.clients));
        setShootCategory(
          resolveShootCategoryFromLabel(loadedShootTypes, entry?.shootType ?? ""),
        );
      } catch (error) {
        if (cancelled) return;
        showToast(
          error instanceof Error ? error.message : "Could not load income form data.",
          "error",
        );
        setClients([]);
        setBookings([]);
        setShootTypes(FALLBACK_SHOOT_TYPES);
        setClientId(resolveClientId(entry, []));
        setShootCategory(resolveShootCategoryFromLabel(FALLBACK_SHOOT_TYPES, entry?.shootType ?? ""));
      } finally {
        if (!cancelled) {
          setClientsLoading(false);
          setBookingsLoading(false);
          setShootTypesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, entry?.id, entry?.bookingId, entry?.clientId, entry?.clientName, entry?.shootType, showToast]);

  function applyBooking(booking: ApiBooking) {
    setBookingId(booking._id);
    setTitle(booking.title?.trim() || "");
    if (booking.client?._id) {
      setClientId(booking.client._id);
    }
    const resolved = resolveShootCategoryFromApi(
      { category: booking.category, shootType: booking.shootType },
      resolvedShootTypes,
    );
    setShootCategory(resolved.category);
    if (booking.amountCharged && booking.amountCharged > 0) {
      setTotalAmountInput(formatAmountChargedInput(booking.amountCharged));
    }
    const bookingDate = booking.startsAt?.slice(0, 10);
    if (bookingDate) setDate(bookingDate);
  }

  function handleBookingChange(nextBookingId: string) {
    setBookingId(nextBookingId);
    if (!nextBookingId) return;
    const booking = bookings.find((row) => row._id === nextBookingId);
    if (booking) applyBooking(booking);
  }

  function handleClose() {
    if (busy) return;
    onClose();
  }

  function handleNewClientSaved(client: ApiClient) {
    if (!client?._id) return;
    setClients((prev) => {
      const without = prev.filter((row) => row._id !== client._id);
      return [...without, client];
    });
    setClientId(client._id);
    setAddClientOpen(false);
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy || clientsLoading || bookingsLoading || shootTypesLoading) return;

    const trimmedTitle = title.trim();
    const client = clientsForSelect.find((row) => row._id === clientId);
    const clientName = client?.name?.trim() ?? entry?.clientName?.trim() ?? "";
    const shootMeta = findShootTypeMeta(resolvedShootTypes, shootCategory);
    const shootTypeLabel = shootMeta?.label ?? shootCategory.trim();
    const currency = entry?.currency ?? "GHS";

    if (!clientId || !clientName) {
      showToast("Please select a client.", "error");
      return;
    }
    if (!trimmedTitle) {
      showToast("Please enter a title.", "error");
      return;
    }
    if (!shootCategory.trim()) {
      showToast("Please select a shoot type.", "error");
      return;
    }
    if (parsedTotal == null) {
      showToast("Please enter a valid total amount.", "error");
      return;
    }
    if (parsedTotal <= 0) {
      showToast("Total amount must be greater than zero.", "error");
      return;
    }
    if (parsedPaying == null) {
      showToast("Please enter a valid amount paying.", "error");
      return;
    }
    if (parsedPaying < 0) {
      showToast("Amount paying cannot be negative.", "error");
      return;
    }
    if (parsedPaying > parsedTotal) {
      showToast("Amount paying cannot exceed the total amount.", "error");
      return;
    }
    if (!date.trim()) {
      showToast("Please select a date.", "error");
      return;
    }

    setBusy(true);
    const payload = {
      date: date.trim(),
      clientId,
      title: trimmedTitle,
      shootType: shootTypeLabel,
      totalAmount: parsedTotal,
      amountPaying: parsedPaying,
      currency,
      bookingId: bookingId || undefined,
    };

    void (async () => {
      try {
        const { entry: saved } =
          isEdit && entry?.id
            ? await updateIncome(entry.id, payload)
            : await createIncome(payload);
        onSaved?.(saved);
        showToast(isEdit ? "Income updated." : "Income added.", "success");
        onClose();
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "Failed to save income.",
          "error",
        );
      } finally {
        setBusy(false);
      }
    })();
  }

  const formBusy = busy || clientsLoading || bookingsLoading || shootTypesLoading;

  return (
    <>
      <FormModal open={open} onClose={handleClose} busy={formBusy} maxWidth="lg">
        <FormModalHeader
          icon={Banknote}
          title={isEdit ? "Edit income" : "Add income"}
          description="Record a charge and payment. Status is set from how much has been paid."
          onClose={handleClose}
          titleId={`${formId}-title`}
        />
        <FormModalForm id={formId} onSubmit={submit}>
          <FormModalBody>
            <FormModalSection>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormField
                    label="Link booking"
                    hint="Optional — pulls title, client, shoot type, and amount charged from a booking."
                  >
                    <FormSelect
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      value={bookingId || undefined}
                      onChange={(value) => handleBookingChange(value ?? "")}
                      options={bookingOptions}
                      placeholder={bookingsLoading ? "Loading bookings…" : "Select a booking (optional)"}
                      disabled={formBusy || bookingsLoading}
                    />
                  </FormField>
                </div>

                <FormField label="Title" required>
                  <FormInput
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Smith wedding, ceremony"
                    disabled={formBusy}
                  />
                </FormField>

                <FormField label="Shoot type" required>
                  <FormShootTypeSelect
                    shootTypes={resolvedShootTypes}
                    value={shootCategory}
                    onChange={setShootCategory}
                    disabled={formBusy || shootTypesLoading}
                    placeholder={shootTypesLoading ? "Loading shoot types…" : "Select shoot type"}
                  />
                </FormField>

                <div className="sm:col-span-2">
                  <FormField
                    label="Client"
                    required
                    action={
                      <button
                        type="button"
                        disabled={formBusy}
                        onClick={() => setAddClientOpen(true)}
                        className={formModalSecondaryButtonClass}
                      >
                        <UserPlus
                          className="h-3.5 w-3.5 shrink-0 text-brand dark:text-brand-on-dark"
                          aria-hidden
                        />
                        Add client
                      </button>
                    }
                    hint={
                      !clientsLoading && clients.length === 0
                        ? "No clients yet. Use Add client to create one."
                        : undefined
                    }
                  >
                    <ClientSearchSelect
                      clients={clientsForSelect}
                      value={clientId}
                      onChange={setClientId}
                      loading={clientsLoading}
                      disabled={formBusy}
                      placeholder="Select a client…"
                    />
                  </FormField>
                </div>

                <FormField label="Date" required>
                  <FormDatePicker value={date} onChange={setDate} disabled={formBusy} />
                </FormField>

                <FormField label="Total amount (GHS)" required>
                  <FormInput
                    value={totalAmountInput}
                    onChange={(e) => setTotalAmountInput(e.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    disabled={formBusy}
                  />
                </FormField>

                <FormField label="Amount paying (GHS)" required>
                  <FormInput
                    value={amountPayingInput}
                    onChange={(e) => setAmountPayingInput(e.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    disabled={formBusy}
                  />
                </FormField>

                <div className="flex flex-col justify-end">
                  <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Payment status
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Tag color={statusTagColor(previewStatus)}>{incomeStatusLabel(previewStatus)}</Tag>
                      <span className="text-sm text-zinc-600 dark:text-zinc-300">
                        {previewPercent}% of total
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </FormModalSection>
          </FormModalBody>
          <FormModalOnboardingFooter
            formId={formId}
            busy={formBusy}
            submitLabel={isEdit ? "Save changes" : "Add income"}
            onCancel={handleClose}
          />
        </FormModalForm>
      </FormModal>

      <CreateClientModal
        open={addClientOpen}
        client={null}
        elevated
        onClose={() => setAddClientOpen(false)}
        onSaved={handleNewClientSaved}
      />
    </>
  );
}
