"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CoverFocalPreview } from "@/components/photographer/cover-focal-preview";
import { CreateClientModal } from "@/components/photographer/create-client-modal";
import { ClientSearchSelect } from "@/components/ui/client-search-select";
import { FormSelect } from "@/components/ui/form-select";
import {
  FormField,
  FormModal,
  FormModalBody,
  FormModalFooter,
  FormModalHeader,
  FormModalSection,
  formModalSecondaryButtonClass,
} from "@/components/ui/form-modal";
import { FormInput, FormTextArea } from "@/components/ui/form-input";
import {
  AlignLeft,
  CalendarDays,
  Clock,
  FolderPlus,
  ImagePlus,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { listClients, type ApiClient } from "@/lib/clients-api";
import {
  createFolder,
  FALLBACK_SHARE_EXPIRY_PRESETS,
  generateGalleryDescription,
  getFolderClientId,
  getFolderCoverUrl,
  getShareLinkExpiryPresets,
  parseFolderCoverFocal,
  updateFolder,
  type ApiFolder,
  type ShareLinkExpiryPreset,
} from "@/lib/folders-api";

type Props = {
  open: boolean;
  onClose: () => void;
  /** When provided, the modal switches to edit mode. */
  folder?: ApiFolder | null;
  /** Called after a successful create or update. */
  onSaved?: (folder: ApiFolder) => void;
};

export function CreateFolderModal({ open, onClose, folder, onSaved }: Props) {
  const { showToast } = useToast();
  const isEdit = Boolean(folder?._id);

  const [clients, setClients] = useState<ApiClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  const [clientId, setClientId] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [useDefaultCover, setUseDefaultCover] = useState(true);
  const [linkExpiry, setLinkExpiry] = useState("30d");
  const [expiryPresets, setExpiryPresets] = useState<ShareLinkExpiryPreset[]>(
    FALLBACK_SHARE_EXPIRY_PRESETS,
  );
  const [busy, setBusy] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [coverFocalX, setCoverFocalX] = useState(50);
  const [coverFocalY, setCoverFocalY] = useState(50);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setClientId(folder ? getFolderClientId(folder) : "");
    setEventName(folder?.eventName ?? "");
    setEventDate(folder?.eventDate ? folder.eventDate.slice(0, 10) : "");
    setDescription(folder?.description ?? "");
    setCoverFile(null);
    setCoverPreview(folder ? getFolderCoverUrl(folder) : null);
    setUseDefaultCover(folder ? folder.usingDefaultCover !== false : true);
    const focal = folder ? parseFolderCoverFocal(folder) : { x: 50, y: 50 };
    setCoverFocalX(focal.x);
    setCoverFocalY(focal.y);
    setLinkExpiry("30d");
    setBusy(false);
  }, [open, folder]);

  useEffect(() => {
    if (!open || isEdit) return;
    let cancelled = false;
    getShareLinkExpiryPresets()
      .then((list) => {
        if (!cancelled && list.length > 0) setExpiryPresets(list);
      })
      .catch(() => {
        if (!cancelled) setExpiryPresets(FALLBACK_SHARE_EXPIRY_PRESETS);
      });
    return () => {
      cancelled = true;
    };
  }, [open, isEdit]);

  useEffect(() => {
    if (!linkExpiry || !expiryPresets.some((p) => p.id === linkExpiry)) {
      setLinkExpiry(expiryPresets[0]?.id ?? "30d");
    }
  }, [expiryPresets]);

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

  useEffect(() => {
    if (!coverFile) return;
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name)),
    [clients],
  );

  const showCoverFocalPicker = useMemo(
    () =>
      Boolean(
        coverPreview &&
          (coverFile || (isEdit && folder != null && folder.usingDefaultCover === false)),
      ),
    [coverPreview, coverFile, isEdit, folder],
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

  if (!open) return null;

  function handleClose() {
    if (busy) return;
    onClose();
  }

  function pickFile() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && !file.type.startsWith("image/")) {
      showToast("Please choose an image file.", "error");
      e.currentTarget.value = "";
      return;
    }
    setCoverFile(file);
    if (file) {
      setUseDefaultCover(false);
      setCoverFocalX(50);
      setCoverFocalY(50);
    }
    e.currentTarget.value = "";
  }

  function clearCover() {
    setCoverFile(null);
    setCoverPreview(null);
    setUseDefaultCover(true);
    setCoverFocalX(50);
    setCoverFocalY(50);
  }

  async function handleGenerateDescription() {
    const name = eventName.trim();
    if (!name || generatingDescription || busy) return;
    setGeneratingDescription(true);
    try {
      const text = await generateGalleryDescription(name);
      if (text) setDescription(text);
      else showToast("No description was returned.", "error");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not generate description.", "error");
    } finally {
      setGeneratingDescription(false);
    }
  }

  async function submit() {
    if (busy) return;

    const trimmedEventName = eventName.trim();
    const trimmedDescription = description.trim();

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

    setBusy(true);
    try {
      const shouldSendFocal = Boolean(coverFile) || (!useDefaultCover && Boolean(coverPreview));
      const focalFields = shouldSendFocal ? { coverFocalX, coverFocalY } : {};

      const saved = isEdit
        ? await updateFolder(folder!._id, {
            eventName: trimmedEventName,
            eventDate,
            description: trimmedDescription,
            coverImage: coverFile ?? null,
            useDefaultCover: coverFile ? false : useDefaultCover,
            ...focalFields,
          })
        : await createFolder({
            clientId,
            eventName: trimmedEventName,
            eventDate,
            description: trimmedDescription,
            linkExpiry,
            coverImage: coverFile ?? null,
            useDefaultCover,
            ...focalFields,
          });

      showToast(isEdit ? "Folder updated." : "Folder created.", "success");
      onSaved?.(saved);
      onClose();
    } catch (err) {
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
      <FormModal open={open} onClose={handleClose} busy={busy}>
        <FormModalHeader
          icon={FolderPlus}
          title={isEdit ? "Edit gallery" : "New gallery"}
          description={
            isEdit
              ? "Update details or swap the cover image."
              : "Choose a client, event info, and share defaults."
          }
        />
        <FormModalBody>
          <FormModalSection title="Details">
            {!isEdit ? (
              <FormField
                label="Client"
                icon={UserRound}
                action={
                  <button
                    type="button"
                    onClick={() => setAddClientOpen(true)}
                    disabled={busy || clientsLoading}
                    className={formModalSecondaryButtonClass}
                  >
                    <UserPlus className="h-3.5 w-3.5 shrink-0 text-brand dark:text-brand-on-dark" aria-hidden />
                    Add client
                  </button>
                }
              >
                <ClientSearchSelect
                  clients={sortedClients}
                  value={clientId}
                  onChange={setClientId}
                  loading={clientsLoading}
                  disabled={busy}
                />
              </FormField>
            ) : null}

            <FormField label="Event name" required>
              <FormInput
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Sarah & James, wedding day"
                disabled={busy}
              />
            </FormField>

            <FormField label="Event date" icon={CalendarDays} required>
              <FormInput
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                disabled={busy}
              />
            </FormField>

            <FormField
              label="Description"
              icon={AlignLeft}
              optional
              action={
                !isEdit ? (
                  <button
                    type="button"
                    onClick={() => void handleGenerateDescription()}
                    disabled={busy || generatingDescription || !eventName.trim()}
                    className={formModalSecondaryButtonClass}
                  >
                    {generatingDescription ? "Generating…" : "Generate with AI"}
                  </button>
                ) : undefined
              }
            >
              <FormTextArea
                className="min-h-[92px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes for this gallery…"
                disabled={busy}
              />
            </FormField>
          </FormModalSection>

          {!isEdit ? (
            <FormModalSection title="Sharing" variant="dashed">
              <FormField label="Share link expiry" icon={Clock}>
                <FormSelect
                  value={
                    expiryPresets.some((p) => p.id === linkExpiry)
                      ? linkExpiry
                      : (expiryPresets[0]?.id ?? "30d")
                  }
                  onChange={setLinkExpiry}
                  disabled={busy}
                  options={expiryPresets.map((p) => ({ value: p.id, label: p.label }))}
                />
              </FormField>
            </FormModalSection>
          ) : null}

          <FormModalSection title="Cover" variant="plain">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {showCoverFocalPicker && coverPreview ? (
                <CoverFocalPreview
                  imageUrl={coverPreview}
                  focalX={coverFocalX}
                  focalY={coverFocalY}
                  onFocalChange={(x, y) => {
                    setCoverFocalX(x);
                    setCoverFocalY(y);
                  }}
                  disabled={busy}
                  topRight={
                    <button
                      type="button"
                      onClick={clearCover}
                      disabled={busy}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white shadow-md backdrop-blur-sm transition hover:bg-black/80"
                      aria-label="Remove cover"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  }
                />
              ) : (
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-100 to-zinc-50 shadow-inner dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-950 sm:h-36 sm:w-44 sm:shrink-0">
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-1 px-3 text-center sm:min-h-0">
                      <ImagePlus className="h-8 w-8 text-zinc-300 dark:text-zinc-600" aria-hidden />
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {useDefaultCover ? "Studio default" : "No image"}
                      </span>
                    </div>
                  )}
                  {coverPreview ? (
                    <button
                      type="button"
                      onClick={clearCover}
                      disabled={busy}
                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white shadow-md backdrop-blur-sm transition hover:bg-black/80"
                      aria-label="Remove cover"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              )}

              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <button
                  type="button"
                  onClick={pickFile}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  <ImagePlus className="h-4 w-4 text-brand dark:text-brand-on-dark" aria-hidden />
                  {coverFile ? "Replace image" : coverPreview ? "Change image" : "Upload cover"}
                </button>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-transparent px-1 py-1 text-sm text-zinc-600 transition hover:border-zinc-200 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80">
                  <input
                    type="checkbox"
                    checked={useDefaultCover && !coverFile}
                    disabled={busy || Boolean(coverFile)}
                    onChange={(e) => {
                      setUseDefaultCover(e.target.checked);
                      if (e.target.checked) {
                        setCoverFile(null);
                        setCoverPreview(null);
                        setCoverFocalX(50);
                        setCoverFocalY(50);
                      }
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-brand focus:ring-brand"
                  />
                  <span>Use the studio default cover instead of uploading.</span>
                </label>
                <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={onFileChange} />
              </div>
            </div>
          </FormModalSection>
        </FormModalBody>
        <FormModalFooter
          onCancel={handleClose}
          onSubmit={() => void submit()}
          submitLabel={isEdit ? "Save changes" : "Create gallery"}
          busyLabel={isEdit ? "Saving…" : "Creating…"}
          busy={busy}
        />
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
