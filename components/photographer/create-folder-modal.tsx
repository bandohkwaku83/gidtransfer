"use client";

import type { FormEvent } from "react";
import { useEffect, useId, useMemo, useState } from "react";
import { GalleryAddressField } from "@/components/photographer/gallery-address-field";
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
import { FormInput } from "@/components/ui/form-input";
import {
  onboardingAntInputClassName,
} from "@/lib/onboarding-field-styles";
import { FolderPlus, UserPlus } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { getBookingsMeta, type BookingShootTypeMeta } from "@/lib/bookings-api";
import {
  defaultShootTypeId,
  FALLBACK_SHOOT_TYPES,
  findShootTypeMeta,
} from "@/lib/booking-shoot-types";
import { getAuth } from "@/lib/auth-demo";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";
import { isAtGalleryLimit } from "@/lib/plan-entitlements";
import { useGuardViewOnlyWrite } from "@/lib/use-view-only-write";
import { listClients, type ApiClient } from "@/lib/clients-api";
import {
  defaultStudioUrlSuffix,
  parseTenantFromHostname,
  slugifyGallerySlug,
  type StudioHostOptions,
} from "@/lib/studio-url";
import {
  createFolder,
  getFolderClientId,
  updateFolder,
  type ApiFolder,
} from "@/lib/folders-api";

type Props = {
  open: boolean;
  onClose: () => void;
  /** When provided, the modal switches to edit mode. */
  folder?: ApiFolder | null;
  /** Active gallery count for maxGalleries gating (create only). */
  activeGalleryCount?: number | null;
  /** Called after a successful create or update. */
  onSaved?: (folder: ApiFolder) => void;
};

const GALLERY_MODAL_IMAGE = "/images/gallery-form.png";
/** Default share link expiry when creating a gallery (no UI control). */
const DEFAULT_LINK_EXPIRY = "30d";

export function CreateFolderModal({
  open,
  onClose,
  folder,
  activeGalleryCount,
  onSaved,
}: Props) {
  const { showToast } = useToast();
  const { openUpgrade, handlePlanError, plan, trialExpired } = usePlanEntitlements();
  const guardViewOnlyWrite = useGuardViewOnlyWrite();
  const formId = useId();
  const isEdit = Boolean(folder?._id);

  const [clients, setClients] = useState<ApiClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  const [clientId, setClientId] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [galleryType, setGalleryType] = useState("portraits");
  const [shootTypes, setShootTypes] = useState<BookingShootTypeMeta[]>(FALLBACK_SHOOT_TYPES);
  /** URL slug segment — independent of event name after Edit on gallery address. */
  const [gallerySlug, setGallerySlug] = useState("");
  const [urlSlugTouched, setUrlSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);

  const resolvedShootTypes = useMemo(
    () => (shootTypes.length > 0 ? shootTypes : FALLBACK_SHOOT_TYPES),
    [shootTypes],
  );

  const studioHost = useMemo(() => {
    const studio = getAuth()?.user?.studio;
    const companySlug =
      studio?.companySlug?.trim() ||
      (typeof window !== "undefined"
        ? parseTenantFromHostname(window.location.host) ?? ""
        : "");
    const options: StudioHostOptions = {
      studioUrl: studio?.studioUrl,
      studioUrlSuffix: studio?.studioUrlSuffix?.trim() || defaultStudioUrlSuffix(),
    };
    return { companySlug, options };
  }, [open]);

  function handleGallerySlugChange(slug: string) {
    setUrlSlugTouched(true);
    setGallerySlug(slug);
  }

  useEffect(() => {
    if (!open) return;
    const name = folder?.eventName ?? "";
    setClientId(folder ? getFolderClientId(folder) : "");
    setEventName(name);
    setGallerySlug(folder?.slug?.trim() || slugifyGallerySlug(name));
    setUrlSlugTouched(false);
    setEventDate(folder?.eventDate ? folder.eventDate.slice(0, 10) : "");
    setGalleryType(folder?.galleryType?.trim() ?? "");
    setBusy(false);
  }, [open, folder]);

  useEffect(() => {
    if (!open || urlSlugTouched) return;
    setGallerySlug(slugifyGallerySlug(eventName));
  }, [open, eventName, urlSlugTouched]);

  useEffect(() => {
    if (!open) return;
    setGalleryType((current) => {
      if (current && findShootTypeMeta(resolvedShootTypes, current)) return current;
      const fromFolder = folder?.galleryType?.trim();
      if (fromFolder && findShootTypeMeta(resolvedShootTypes, fromFolder)) return fromFolder;
      return defaultShootTypeId(resolvedShootTypes);
    });
  }, [open, folder, resolvedShootTypes]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getBookingsMeta()
      .then((meta) => {
        if (!cancelled && meta.shootTypes.length > 0) setShootTypes(meta.shootTypes);
      })
      .catch(() => {
        if (!cancelled) setShootTypes(FALLBACK_SHOOT_TYPES);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setClientsLoading(true);
    listClients()
      .then((data) => {
        if (!cancelled) setClients(data.clients);
      })
      .catch((err) => {
        if (cancelled) return;
        showToast(
          err instanceof Error ? err.message : "Failed to load clients.",
          "error",
        );
      })
      .finally(() => {
        if (!cancelled) setClientsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, showToast]);

  useEffect(() => {
    if (!open) setAddClientOpen(false);
  }, [open]);

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name)),
    [clients],
  );

  function handleNewClientSaved(saved: ApiClient) {
    setClients((prev) => {
      if (prev.some((c) => c._id === saved._id)) {
        return prev.map((c) => (c._id === saved._id ? saved : c));
      }
      return [...prev, saved];
    });
    setClientId(saved._id);
  }

  function handleClose() {
    if (busy) return;
    onClose();
  }

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (busy) return;
    if (guardViewOnlyWrite()) return;

    const trimmedEventName = eventName.trim();

    if (!isEdit && !clientId) {
      showToast("Please select a client.", "error");
      return;
    }
    if (!trimmedEventName) {
      showToast("Please enter an event name.", "error");
      return;
    }
    if (!eventDate) {
      showToast("Please pick an event date.", "error");
      return;
    }
    const typeMeta = findShootTypeMeta(resolvedShootTypes, galleryType);
    if (!typeMeta) {
      showToast("Select a gallery type.", "error");
      return;
    }
    const slug = gallerySlug.trim();
    if (slug.length < 2) {
      showToast("Gallery address must be at least 2 characters.", "error");
      return;
    }

    if (!isEdit) {
      if (trialExpired) {
        openUpgrade({
          trialExpired: true,
          message: "Your free trial has ended. Upgrade to create galleries.",
        });
        return;
      }
      const limit = plan?.maxGalleries;
      if (limit != null && limit <= 0) {
        openUpgrade({
          feature: "clientGalleries",
          message: "Upgrade to create galleries on your plan.",
        });
        return;
      }
      if (
        activeGalleryCount != null &&
        isAtGalleryLimit(plan, activeGalleryCount)
      ) {
        openUpgrade({
          feature: "clientGalleries",
          message:
            limit != null
              ? `Gallery limit reached (${limit}). Upgrade for more galleries.`
              : "Gallery limit reached. Upgrade for more galleries.",
        });
        return;
      }
    }

    setBusy(true);
    try {
      const saved = isEdit
        ? await updateFolder(folder!._id, {
            eventName: trimmedEventName,
            eventDate,
            galleryType: typeMeta.id,
            slug,
          })
        : await createFolder({
            clientId,
            eventName: trimmedEventName,
            eventDate,
            description: "",
            galleryType: typeMeta.id,
            slug,
            linkExpiry: DEFAULT_LINK_EXPIRY,
            useDefaultCover: true,
          });

      showToast(isEdit ? "Folder updated." : "Folder created.", "success");
      onSaved?.(saved);
      onClose();
    } catch (err) {
      if (handlePlanError(err)) return;
      showToast(
        err instanceof Error
          ? err.message
          : isEdit
            ? "Failed to update folder."
            : "Failed to create folder.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FormModal open={open} onClose={handleClose} busy={busy} maxWidth="splitWide">
        <FormModalSplitLayout>
          <FormModalSplitMain>
            <FormModalHeader
              icon={FolderPlus}
              title={isEdit ? "Edit gallery" : "New gallery"}
              description={
                isEdit ? "Update gallery details." : "Choose a client and event details."
              }
            />
            <FormModalForm id={formId} onSubmit={(e) => void handleSubmit(e)}>
              <FormModalBody className="space-y-6">
                {!isEdit ? (
                  <FormModalSection variant="plain">
                    <FormField
                      label="Client"
                      required
                      appearance="onboarding"
                      htmlFor="new-gallery-client"
                      action={
                        <button
                          type="button"
                          onClick={() => setAddClientOpen(true)}
                          disabled={busy || clientsLoading}
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
                        id="new-gallery-client"
                        appearance="onboarding"
                        clients={sortedClients}
                        value={clientId}
                        onChange={setClientId}
                        loading={clientsLoading}
                        disabled={busy}
                      />
                    </FormField>
                  </FormModalSection>
                ) : null}

                <FormModalSection variant="plain">
                  <FormField label="Event name" required appearance="onboarding">
                    <FormInput
                      className={onboardingAntInputClassName}
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="e.g. Sarah & James, wedding day"
                      disabled={busy}
                      autoFocus
                    />
                  </FormField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Event date" required appearance="onboarding">
                      <FormDatePicker
                        appearance="onboarding"
                        value={eventDate}
                        onChange={setEventDate}
                        disabled={busy}
                        inputReadOnly
                      />
                    </FormField>

                    <FormField
                      label="Gallery type"
                      required
                      appearance="onboarding"
                      htmlFor="new-gallery-type"
                    >
                      <FormShootTypeSelect
                        id="new-gallery-type"
                        shootTypes={resolvedShootTypes}
                        value={galleryType}
                        onChange={setGalleryType}
                        disabled={busy}
                        placeholder="Select type"
                        showColorDots={false}
                      />
                    </FormField>
                  </div>

                  <FormField label="Gallery address (URL)" appearance="onboarding">
                    <GalleryAddressField
                      id="new-gallery-address"
                      companySlug={studioHost.companySlug}
                      gallerySlug={gallerySlug}
                      onGallerySlugChange={handleGallerySlugChange}
                      studioHostOptions={studioHost.options}
                      disabled={busy}
                    />
                  </FormField>
                </FormModalSection>
              </FormModalBody>
            </FormModalForm>
            <FormModalOnboardingFooter
              formId={formId}
              onCancel={handleClose}
              submitLabel={isEdit ? "Save changes" : "Create gallery"}
              busyLabel={isEdit ? "Saving…" : "Creating…"}
              busy={busy}
              submitDisabled={!isEdit && (!clientId || clientsLoading)}
            />
          </FormModalSplitMain>
          <FormModalImageAside src={GALLERY_MODAL_IMAGE} />
        </FormModalSplitLayout>
      </FormModal>
      <CreateClientModal
        open={addClientOpen}
        elevated
        onClose={() => setAddClientOpen(false)}
        onSaved={handleNewClientSaved}
      />
    </>
  );
}
