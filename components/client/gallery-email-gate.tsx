"use client";

import { Mail } from "lucide-react";
import { useCallback, useState } from "react";
import { nativeInputClassName } from "@/components/ui/form-input";
import { isValidGalleryAccessEmail } from "@/lib/gallery-email-access";
import { cn } from "@/lib/utils";

type GalleryEmailGateProps = {
  studioName?: string;
  onSubmit: (email: string) => boolean | Promise<boolean>;
};

export function GalleryEmailGate({
  studioName = "your photographer",
  onSubmit,
}: GalleryEmailGateProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        setError("Enter your email address.");
        return;
      }
      if (!isValidGalleryAccessEmail(trimmed)) {
        setError("Enter a valid email address.");
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        const ok = await onSubmit(trimmed);
        if (!ok) {
          setError("Something went wrong. Please try again.");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmit],
  );

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="w-full max-w-[22rem] rounded-2xl border border-zinc-200/80 bg-white px-6 py-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft dark:bg-brand/15">
          <Mail className="h-5 w-5 text-brand dark:text-brand-on-dark" strokeWidth={1.75} aria-hidden />
        </div>

        <h1 className="mt-5 text-center text-[1.0625rem] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Enter your email
        </h1>

        <p className="mt-2.5 text-center text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Share your email with{" "}
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            {studioName || "your photographer"}
          </span>{" "}
          to view this gallery.
        </p>

        <form
          className="mt-7"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(email);
          }}
        >
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            disabled={submitting}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            aria-label="Your email address"
            aria-invalid={error ? true : undefined}
            className={cn(
              nativeInputClassName,
              "text-center sm:text-left",
              error && "border-red-300 focus:border-red-400 dark:border-red-800",
            )}
          />

          {error ? (
            <p className="mt-2 text-center text-xs text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="mt-4 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? "Opening…" : "Open gallery"}
          </button>
        </form>
      </div>
    </div>
  );
}
