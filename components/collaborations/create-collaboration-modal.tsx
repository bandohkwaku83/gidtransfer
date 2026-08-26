"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban } from "lucide-react";
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
import { FormInput, FormTextArea } from "@/components/ui/form-input";
import {
  onboardingAntInputClassName,
  onboardingTextareaClassName,
} from "@/lib/onboarding-field-styles";
import {
  createCollaboration,
  type CollaborationWorkspace,
} from "@/lib/collaborations-api";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called after a successful create (before navigation). */
  onSaved?: (workspace: CollaborationWorkspace) => void;
  /** When true, navigate to the new workspace after create. Default true. */
  navigateOnCreate?: boolean;
};

const WORKSPACE_MODAL_IMAGE = "/images/gallery-form.png";

export function CreateCollaborationModal({
  open,
  onClose,
  onSaved,
  navigateOnCreate = true,
}: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const { can, handlePlanError, openUpgrade } = usePlanEntitlements();
  const formId = useId();
  const canCollaborate = can("collaboration");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
    setBusy(false);
  }, [open]);

  function handleClose() {
    if (busy) return;
    onClose();
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy) return;

    if (!canCollaborate) {
      openUpgrade({
        feature: "collaboration",
        message: "Team collaboration is available on the Premium plan.",
        requiredPlans: ["premium"],
        suggestedPlanId: "premium",
      });
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
      showToast("Please enter a workspace name.", "error");
      return;
    }

    setBusy(true);
    try {
      const { workspace } = await createCollaboration({
        name: trimmed,
        description: description.trim() || null,
        linkedGalleryId: null,
      });
      showToast("Workspace created.", "success");
      onSaved?.(workspace);
      onClose();
      if (navigateOnCreate) {
        router.push(`/collaborations/${workspace.id}`);
      }
    } catch (err) {
      if (handlePlanError(err)) return;
      showToast(
        err instanceof Error ? err.message : "Failed to create workspace.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormModal open={open} onClose={handleClose} busy={busy} maxWidth="splitWide">
      <FormModalSplitLayout>
        <FormModalSplitMain>
          <FormModalHeader
            icon={FolderKanban}
            title="New workspace"
            description="Name the shoot, then invite your team"
          />
          <FormModalForm id={formId} onSubmit={(e) => void submit(e)}>
            <FormModalBody className="space-y-5">
              <FormModalSection variant="plain" title="Workspace">
                <FormField label="Name" required appearance="onboarding">
                  <FormInput
                    className={onboardingAntInputClassName}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Wedding — Ama & Kojo"
                    disabled={busy}
                    autoFocus
                  />
                </FormField>

                <FormField label="Description" optional appearance="onboarding">
                  <FormTextArea
                    className={onboardingTextareaClassName}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Second shooters · Saturday coverage"
                    disabled={busy}
                    rows={3}
                  />
                </FormField>
              </FormModalSection>
            </FormModalBody>
          </FormModalForm>
          <FormModalOnboardingFooter
            formId={formId}
            onCancel={handleClose}
            submitLabel="Create workspace"
            busyLabel="Creating…"
            busy={busy}
          />
        </FormModalSplitMain>
        <FormModalImageAside src={WORKSPACE_MODAL_IMAGE} />
      </FormModalSplitLayout>
    </FormModal>
  );
}
