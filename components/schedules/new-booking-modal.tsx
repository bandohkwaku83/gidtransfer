"use client";

import type { FormEvent } from "react";
import { useEffect, useId, useMemo, useState } from "react";
import { CalendarPlus, UserPlus } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { CreateClientModal } from "@/components/photographer/create-client-modal";
import { ClientSearchSelect } from "@/components/ui/client-search-select";
import { FormSelect } from "@/components/ui/form-select";
import {
  FormField,
  FormModal,
  FormModalBody,
  FormModalFooter,
  FormModalForm,
  FormModalHeader,
  FormModalSection,
  formModalSecondaryButtonClass,
} from "@/components/ui/form-modal";
import { FormInput, FormTextArea } from "@/components/ui/form-input";
import type { BookedShoot, ShootKind } from "@/components/schedules/booking-types";
import { KIND_META, SHOOT_KINDS_ORDER } from "@/components/schedules/booking-types";
import type { BookingShootTypeMeta } from "@/lib/bookings-api";
import { apiShootTypeToKind } from "@/lib/bookings-api";
import { listClients, type ApiClient } from "@/lib/clients-api";

export type NewBookingDraft = Omit<BookedShoot, "id">;

type Props = {
  open: boolean;
  onClose: () => void;
  /** ISO date YYYY-MM-DD */
  defaultDate: string;
  /** When set, the form opens in edit mode for this booking. */
  booking?: BookedShoot | null;
  /** From `GET /api/bookings/meta` `shootTypes`; when empty, local defaults are used. */
  shootTypes?: BookingShootTypeMeta[];
  onSave: (draft: NewBookingDraft) => void | Promise<void>;
};

function defaultKindFromShootTypes(shootTypes: BookingShootTypeMeta[] | undefined): ShootKind {
  if (shootTypes && shootTypes.length > 0) {
    return apiShootTypeToKind(shootTypes[0].id);
  }
  return "portraits";
}

export function NewBookingModal({
  open,
  onClose,
  defaultDate,
  booking,
  shootTypes,
  onSave,
}: Props) {
  const isEdit = Boolean(booking?.id);
  const { showToast } = useToast();
  const formId = useId();

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("");
  const [kind, setKind] = useState<ShootKind>("portraits");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

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

  const typeOptions = useMemo(() => {
    if (shootTypes && shootTypes.length > 0) {
      return shootTypes.map((t) => ({
        value: apiShootTypeToKind(t.id),
        label: t.label,
      }));
    }
    return SHOOT_KINDS_ORDER.map((k) => ({ value: k, label: KIND_META[k].label }));
  }, [shootTypes]);

  useEffect(() => {
    if (!open) return;
    if (booking) {
      setDate(booking.date);
      setTitle(booking.title);
      setClientId(booking.clientId);
      setStartTime(booking.startTime);
      setEndTime(booking.endTime ?? "");
      setKind(booking.kind);
      setLocation(booking.location ?? "");
      setDescription(booking.description ?? "");
    } else {
      setDate(defaultDate);
      setTitle("");
      setClientId("");
      setStartTime("09:00");
      setEndTime("");
      setKind(defaultKindFromShootTypes(shootTypes));
      setLocation("");
      setDescription("");
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
    const t = title.trim();
    if (!t || !clientId || submitting) return;
    const client = clientsForSelect.find((c) => c._id === clientId);
    const name = client?.name?.trim() ?? booking?.clientName?.trim() ?? "";
    if (!name) {
      showToast("Select a valid client.", "error");
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
        kind,
        description: description.trim() || undefined,
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
      <FormModal open={open} onClose={handleClose} busy={submitting}>
        <FormModalHeader
          icon={CalendarPlus}
          title={isEdit ? "Edit booking" : "New booking"}
          description={
            isEdit
              ? "Update shoot details, time, or client."
              : "Schedule a shoot and link it to a client."
          }
          onClose={handleClose}
          busy={submitting}
        />
        <FormModalForm id={formId} onSubmit={(e) => void handleSubmit(e)}>
          <FormModalBody>
            <FormModalSection title="Details">
              <FormField label="Shoot title" required>
                <FormInput
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Smith wedding, ceremony"
                  disabled={submitting}
                />
              </FormField>

              <FormField
                label="Client"
                required
                htmlFor="new-booking-client"
                action={
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setAddClientOpen(true)}
                    className={formModalSecondaryButtonClass}
                  >
                    <UserPlus className="h-3.5 w-3.5 shrink-0 text-brand dark:text-brand-on-dark" aria-hidden />
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
                  clients={clientsForSelect}
                  value={clientId}
                  onChange={setClientId}
                  loading={clientsLoading}
                  disabled={submitting}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Date" required>
                  <FormInput
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={submitting}
                  />
                </FormField>
                <FormField label="Shoot type" htmlFor="new-booking-shoot-type">
                  <FormSelect<ShootKind>
                    id="new-booking-shoot-type"
                    value={kind}
                    onChange={setKind}
                    disabled={submitting}
                    options={typeOptions.map((o) => ({ value: o.value, label: o.label }))}
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Start" required>
                  <FormInput
                    required
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={submitting}
                  />
                </FormField>
                <FormField label="End" optional>
                  <FormInput
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={submitting}
                  />
                </FormField>
              </div>

              <FormField label="Location" optional>
                <FormInput
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Venue or address"
                  disabled={submitting}
                />
              </FormField>

              <FormField label="Notes" optional>
                <FormTextArea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Optional notes for this booking…"
                  className="min-h-[72px]"
                  disabled={submitting}
                />
              </FormField>
            </FormModalSection>
          </FormModalBody>
        </FormModalForm>
        <FormModalFooter
          onCancel={handleClose}
          formId={formId}
          submitLabel={isEdit ? "Save changes" : "Save booking"}
          busyLabel="Saving…"
          busy={submitting}
          submitDisabled={!clientId || clientsLoading}
        />
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
