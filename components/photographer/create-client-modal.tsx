"use client";

import { useEffect, useId, useState } from "react";
import { UserPlus } from "lucide-react";
import { useToast } from "@/components/toast-provider";
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
} from "@/components/ui/form-modal";
import { FormInput, ContactNumberInput } from "@/components/ui/form-input";
import { onboardingAntInputClassName } from "@/lib/onboarding-field-styles";
import {
  createClient,
  updateClient,
  type ApiClient,
} from "@/lib/clients-api";

type Props = {
  open: boolean;
  onClose: () => void;
  /** When provided, the modal switches to edit mode. */
  client?: ApiClient | null;
  /** Called after a successful create or update. */
  onSaved?: (client: ApiClient) => void;
  /** Stack above another modal (e.g. from gallery or booking). */
  elevated?: boolean;
};

const CLIENT_MODAL_IMAGE = "/images/client.jpg";

export function CreateClientModal({ open, onClose, client, onSaved, elevated }: Props) {
  const { showToast } = useToast();
  const formId = useId();

  const isEdit = Boolean(client?._id);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(client?.name ?? "");
    setEmail(client?.email ?? "");
    setContact(client?.contact ?? "");
    setLocation(client?.location ?? "");
    setBusy(false);
  }, [open, client]);

  function handleClose() {
    if (busy) return;
    onClose();
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedContact = contact.trim();
    const trimmedLocation = location.trim();

    if (!trimmedName) {
      showToast("Please enter a client name.", "error");
      return;
    }
    if (!trimmedContact) {
      showToast("Please enter a contact number.", "error");
      return;
    }
    if (!trimmedLocation) {
      showToast("Please enter a location.", "error");
      return;
    }
    if (trimmedEmail && !trimmedEmail.includes("@")) {
      showToast("Please enter a valid email.", "error");
      return;
    }

    setBusy(true);
    try {
      const saved = isEdit
        ? await updateClient(client!._id, {
            name: trimmedName,
            email: trimmedEmail,
            contact: trimmedContact,
            location: trimmedLocation,
          })
        : await createClient({
            name: trimmedName,
            email: trimmedEmail,
            contact: trimmedContact,
            location: trimmedLocation,
          });

      showToast(isEdit ? "Client updated." : "Client created.", "success");
      onSaved?.(saved);
      onClose();
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : isEdit
            ? "Failed to update client."
            : "Failed to create client.";
      showToast(message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormModal open={open} onClose={handleClose} busy={busy} elevated={elevated} maxWidth="splitWide">
      <FormModalSplitLayout>
        <FormModalSplitMain>
          <FormModalHeader
            icon={UserPlus}
            title={isEdit ? "Edit client" : "Add new client"}
            description={
              isEdit
                ? "Update this client's details."
                : "Register client details"
            }
          />
          <FormModalForm id={formId} onSubmit={(e) => void submit(e)}>
            <FormModalBody className="space-y-5">
              <FormModalSection variant="plain" title="Contact">
                <FormField label="Client name" required appearance="onboarding">
                  <FormInput
                    className={onboardingAntInputClassName}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    disabled={busy}
                    autoFocus
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Email" appearance="onboarding">
                    <FormInput
                      className={onboardingAntInputClassName}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email"
                      disabled={busy}
                    />
                  </FormField>

                  <FormField label="Contact number" required appearance="onboarding">
                    <ContactNumberInput
                      className={onboardingAntInputClassName}
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="Enter contact"
                      disabled={busy}
                    />
                  </FormField>
                </div>

                <FormField label="Location" required appearance="onboarding">
                  <FormInput
                    className={onboardingAntInputClassName}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter location"
                    disabled={busy}
                  />
                </FormField>
              </FormModalSection>
            </FormModalBody>
          </FormModalForm>
          <FormModalOnboardingFooter
            formId={formId}
            onCancel={handleClose}
            submitLabel={isEdit ? "Save changes" : "Create client"}
            busyLabel={isEdit ? "Saving…" : "Creating…"}
            busy={busy}
          />
        </FormModalSplitMain>
        <FormModalImageAside src={CLIENT_MODAL_IMAGE} />
      </FormModalSplitLayout>
    </FormModal>
  );
}
