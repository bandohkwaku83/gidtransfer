"use client";

import { FormInput } from "@/components/ui/form-input";
import {
  FormModal,
  FormModalFooter,
  FormModalHeader,
} from "@/components/ui/form-modal";
import { Lock } from "lucide-react";

export type LockFinalModalState = {
  finalId: string;
  amount: string;
};

type LockFinalModalProps = {
  state: LockFinalModalState | null;
  busy?: boolean;
  onClose: () => void;
  onAmountChange: (amount: string) => void;
  onConfirm: () => void;
};

const LOCK_FINAL_TITLE_ID = "lock-final-title";

export function LockFinalModal({
  state,
  busy,
  onClose,
  onAmountChange,
  onConfirm,
}: LockFinalModalProps) {
  if (!state) return null;

  return (
    <FormModal
      open
      priority
      maxWidth="md"
      busy={busy}
      onClose={onClose}
      titleId={LOCK_FINAL_TITLE_ID}
    >
      <FormModalHeader
        icon={Lock}
        title="Lock final for client"
        titleId={LOCK_FINAL_TITLE_ID}
        onClose={onClose}
        busy={busy}
      />

      <div className="space-y-4 px-6 py-5">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Client can preview but not download until you unlock.
        </p>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Amount owing (GHS)
          <FormInput
            inputMode="decimal"
            autoFocus
            value={state.amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="e.g. 500"
            className="mt-1.5"
          />
        </label>
      </div>

      <FormModalFooter
        onCancel={onClose}
        onSubmit={onConfirm}
        submitLabel="Lock final"
        busyLabel="Locking…"
        busy={busy}
      />
    </FormModal>
  );
}
