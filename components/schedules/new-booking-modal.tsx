"use client";

import type { FormEvent } from "react";
import { useEffect, useId, useMemo, useState } from "react";
import { CalendarPlus, UserPlus } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { useGuardViewOnlyWrite } from "@/lib/use-view-only-write";
import { CreateClientModal } from "@/components/photographer/create-client-modal";
import { ClientSearchSelect } from "@/components/ui/client-search-select";
import { FormDatePicker } from "@/components/ui/form-date-picker";
import { FormShootTypeSelect } from "@/components/ui/form-shoot-type-select";
import {
  FormField,
  FormModal,
  FormModalBody,
  FormModalForm,
  FormModalHeader,
  FormModalImageAside,
  FormModalOnboardingFooter,
  FormModalSection,
  FormModalSplitLayout,
  FormModalSplitMain,
  formModalSecondaryButtonClass,
} from "@/components/ui/form-modal";
import { FormInput, FormTextArea } from "@/components/ui/form-input";
import {
  onboardingAntInputClassName,
  onboardingTextareaClassName,
} from "@/lib/onboarding-field-styles";
import {
  formatAmountChargedInput,
  parseAmountChargedInput,
} from "@/lib/booking-amount";
import type { BookingShootTypeMeta } from "@/lib/bookings-api";
import {
  FALLBACK_SHOOT_TYPES,
  findShootTypeMeta,
} from "@/lib/booking-shoot-types";
import { listClients, type ApiClient } from "@/lib/clients-api";
import { cn } from "@/lib/utils";
import type { BookedShoot } from "@/components/schedules/booking-types";

export type NewBookingDraft = Omit<BookedShoot, "id">;

const BOOKING_MODAL_IMAGE = "/images/appointment.png";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultDate: string;
  booking?: BookedShoot | null;
  shootTypes?: BookingShootTypeMeta[];
  onSave: (draft: NewBookingDraft) => void | Promise<void>;
};

function defaultShootCategory(shootTypes: BookingShootTypeMeta[]): string {
  return (
    findShootTypeMeta(shootTypes, "portraits")?.id ??
    findShootTypeMeta(shootTypes, "wedding")?.id ??
    shootTypes[0]?.id ??
    "other"
  );
}

export function NewBookingModal({
  open,
  onClose,
  defaultDate,
  booking,
  shootTypes: shootTypesProp,
  onSave,
}: Props) {
  const isEdit = Boolean(booking?.id);
  const { showToast } = useToast();
  const guardViewOnlyWrite = useGuardViewOnlyWrite();
  const formId = useId();

  const shootTypes = useMemo(
    () => (shootTypesProp && shootTypesProp.length > 0 ? shootTypesProp : FALLBACK_SHOOT_TYPES),
    [shootTypesProp],
  );

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("");
  const [shootCategory, setShootCategory] = useState("portraits");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [amountChargedInput, setAmountChargedInput] = useState("");

  const [clients, setClients] = useState<ApiClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name)),
    [clients],
  );

  const clientsForSelect = useMemo(() => {
    if (!booking?.clientId) return sortedClients;
    if (sortedClients.some((c) => c._id === booking.clientId)) return sortedClients;
    return [
      ...sortedClients,
      {
        _id: booking.clientId,
        name: booking.clientName,
        email: "",
        contact: "",
        location: "",
      },
    ];
  }, [sortedClients, booking]);

  useEffect(() => {
    if (!open) return;
    if (booking) {
      setDate(booking.date);
      setTitle(booking.title);
      setClientId(booking.clientId);
      setStartTime(booking.startTime);
      setEndTime(booking.endTime ?? "");
      setShootCategory(booking.shootCategory);
      setLocation(booking.location ?? "");
      setNotes(booking.notes ?? "");
      setAmountChargedInput(formatAmountChargedInput(booking.amountCharged));
    } else {
      setDate(defaultDate);
      setTitle("");
      setClientId("");
      setStartTime("09:00");
      setEndTime("");
      setShootCategory(defaultShootCategory(shootTypes));
      setLocation("");
      setNotes("");
      setAmountChargedInput("");
    }
    setAddClientOpen(false);
    setSubmitting(false);

    let cancelled = false;
    setClientsLoading(true);
    void (async () => {
      try {
        const res = await listClients("");
        if (!cancelled) setClients(res.clients);
      } catch (e) {
        if (!cancelled) {
          showToast(e instanceof Error ? e.message : "Could not load clients.", "error");
          setClients([]);
        }
      } finally {
        if (!cancelled) setClientsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, defaultDate, booking?.id, showToast, shootTypes]);

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (guardViewOnlyWrite()) return;
    const t = title.trim();
    if (!t || !clientId || submitting) return;
    const client = clientsForSelect.find((c) => c._id === clientId);
    const name = client?.name?.trim() ?? booking?.clientName?.trim() ?? "";
    if (!name) {
      showToast("Select a valid client.", "error");
      return;
    }

    const parsedAmount = parseAmountChargedInput(amountChargedInput);
    if (parsedAmount === null) {
      showToast("Enter a valid amount charged (GHS).", "error");
      return;
    }

    const meta = findShootTypeMeta(shootTypes, shootCategory);
    if (!meta) {
      showToast("Select a valid shoot type.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        title: t,
        clientId,
        clientName: name,
        date,
        startTime,
        endTime: endTime.trim() || undefined,
        location: location.trim() || undefined,
        shootCategory: meta.id,
        shootTypeLabel: meta.label,
        shootColor: meta.color,
        notes: notes.trim() || undefined,
        currency: "GHS",
        amountCharged: parsedAmount ?? 0,
      });
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save booking.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNewClientSaved(c: ApiClient) {
    if (!c?._id) return;
    setClients((prev) => {
      const without = prev.filter((x) => x._id !== c._id);
      return [...without, c];
    });
    setClientId(c._id);
    setAddClientOpen(false);
  }

  return (
    <>
      <FormModal open={open} onClose={handleClose} busy={submitting} maxWidth="splitWide">
        <FormModalSplitLayout>
          <FormModalSplitMain>
            <FormModalHeader
              icon={CalendarPlus}
              title={isEdit ? "Edit booking" : "New booking"}
              description={
                isEdit
                  ? "Update shoot details, time, or client."
                  : "Schedule a shoot and link it to a client."
              }
            />
            <FormModalForm id={formId} onSubmit={(e) => void handleSubmit(e)}>
              <FormModalBody className="space-y-5">
                <FormModalSection variant="plain">
                  <FormField label="Title" required appearance="onboarding">
                    <FormInput
                      className={onboardingAntInputClassName}
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Smith wedding, ceremony"
                      disabled={submitting}
                      autoFocus
                    />
                  </FormField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Shoot type"
                      htmlFor="new-booking-shoot-type"
                      required
                      appearance="onboarding"
                    >
                      <FormShootTypeSelect
                        id="new-booking-shoot-type"
                        shootTypes={shootTypes}
                        value={shootCategory}
                        onChange={setShootCategory}
                        disabled={submitting}
                      />
                    </FormField>
                    <FormField label="Amount charged (GHS)" appearance="onboarding">
                      <FormInput
                        className={onboardingAntInputClassName}
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        value={amountChargedInput}
                        onChange={(e) => setAmountChargedInput(e.target.value)}
                        placeholder="0.00"
                        disabled={submitting}
                      />
                    </FormField>
                  </div>
                </FormModalSection>

                <FormModalSection variant="plain">
                  <FormField
                    label="Client"
                    required
                    appearance="onboarding"
                    htmlFor="new-booking-client"
                    action={
                      <button
                        type="button"
                        disabled={submitting}
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
                      id="new-booking-client"
                      appearance="onboarding"
                      clients={clientsForSelect}
                      value={clientId}
                      onChange={setClientId}
                      loading={clientsLoading}
                      disabled={submitting}
                    />
                  </FormField>
                </FormModalSection>

                <FormModalSection variant="plain" title="Schedule">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField label="Date" required appearance="onboarding">
                      <FormDatePicker
                        appearance="onboarding"
                        value={date}
                        onChange={setDate}
                        disabled={submitting}
                        inputReadOnly
                      />
                    </FormField>
                    <FormField label="Start" required appearance="onboarding">
                      <FormInput
                        className={onboardingAntInputClassName}
                        required
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        disabled={submitting}
                      />
                    </FormField>
                    <FormField label="End" appearance="onboarding">
                      <FormInput
                        className={onboardingAntInputClassName}
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        disabled={submitting}
                      />
                    </FormField>
                  </div>
                </FormModalSection>

                <FormModalSection variant="plain">
                  <FormField label="Location" appearance="onboarding">
                    <FormInput
                      className={onboardingAntInputClassName}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Venue or address"
                      disabled={submitting}
                    />
                  </FormField>

                  <FormField label="Notes" appearance="onboarding">
                    <FormTextArea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      placeholder="Optional notes for this booking…"
                      className={onboardingTextareaClassName}
                      disabled={submitting}
                    />
                  </FormField>
                </FormModalSection>
              </FormModalBody>
            </FormModalForm>
            <FormModalOnboardingFooter
              formId={formId}
              onCancel={handleClose}
              submitLabel={isEdit ? "Save changes" : "Save booking"}
              busyLabel="Saving…"
              busy={submitting}
              submitDisabled={!clientId || clientsLoading}
            />
          </FormModalSplitMain>
          <FormModalImageAside
            src={BOOKING_MODAL_IMAGE}
            imagePositionClassName="object-[72%_center]"
          />
        </FormModalSplitLayout>
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
