"use client";

import { Input } from "antd";
import { Lock } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type GalleryAccessGateProps = {
  studioName: string;
  galleryTitle?: string;
  onUnlock: (pin: string) => boolean;
};

export function GalleryAccessGate({
  studioName,
  galleryTitle,
  onUnlock,
}: GalleryAccessGateProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(
    (value: string) => {
      const digits = value.replace(/\D/g, "").slice(0, 4);
      if (digits.length < 4) {
        setError("Enter all 4 digits.");
        return;
      }
      setSubmitting(true);
      setError(null);
      const ok = onUnlock(digits);
      setSubmitting(false);
      if (!ok) {
        setError("That code is incorrect. Try again or ask your photographer.");
        setPin("");
      }
    },
    [onUnlock],
  );

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-lg ring-1 ring-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/10 sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft dark:bg-brand/20">
          <Lock className="h-6 w-6 text-brand dark:text-brand-on-dark" aria-hidden />
        </div>
        <h1 className="mt-4 text-center text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Protected gallery
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Enter the 4-digit code from{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {studioName || "your photographer"}
          </span>{" "}
          to continue.
        </p>
        {galleryTitle ? (
          <p className="mt-1 text-center text-xs text-zinc-500 dark:text-zinc-500">{galleryTitle}</p>
        ) : null}

        <div className="mt-6 flex justify-center">
          <Input.OTP
            length={4}
            value={pin}
            disabled={submitting}
            onChange={(value) => {
              setPin(value);
              setError(null);
              if (value.length === 4) submit(value);
            }}
            className={cn(
              "[&_.ant-input]:!h-9 [&_.ant-input]:!w-8 [&_.ant-input]:!rounded-lg [&_.ant-input]:!text-base [&_.ant-input]:!font-semibold",
              error && "[&_.ant-input]:!border-red-400",
            )}
            aria-label="Gallery access code"
          />
        </div>

        {error ? (
          <p className="mt-3 text-center text-xs font-medium text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={submitting || pin.length < 4}
          onClick={() => submit(pin)}
          className="mt-6 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Checking…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
