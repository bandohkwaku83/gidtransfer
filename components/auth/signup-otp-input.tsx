"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

type SignupOtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
};

export function SignupOtpInput({
  length = 4,
  value,
  onChange,
  disabled = false,
  error = false,
  autoFocus = false,
  onComplete,
}: SignupOtpInputProps) {
  const inputId = useId();
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const completedForRef = useRef<string | null>(null);
  const digits = value.replace(/\D/g, "").slice(0, length).split("");
  while (digits.length < length) digits.push("");

  const emitComplete = useCallback(
    (joined: string) => {
      if (joined.length !== length) {
        completedForRef.current = null;
        return;
      }
      if (completedForRef.current === joined) return;
      completedForRef.current = joined;
      onComplete?.(joined);
    },
    [length, onComplete],
  );

  const setDigits = useCallback(
    (next: string[]) => {
      const joined = next.join("").replace(/\D/g, "").slice(0, length);
      onChange(joined);
      emitComplete(joined);
    },
    [emitComplete, length, onChange],
  );

  useEffect(() => {
    if (!autoFocus) return;
    refs.current[0]?.focus();
  }, [autoFocus]);

  // Autofill / SMS one-time-code can update `value` without a keystroke path.
  useEffect(() => {
    emitComplete(value.replace(/\D/g, "").slice(0, length));
  }, [emitComplete, length, value]);

  function focusIndex(index: number) {
    const clamped = Math.max(0, Math.min(length - 1, index));
    refs.current[clamped]?.focus();
    refs.current[clamped]?.select();
  }

  function applyPaste(paste: string, startIndex: number) {
    const chars = paste.replace(/\D/g, "").slice(0, length - startIndex).split("");
    if (chars.length === 0) return;
    const next = [...digits];
    chars.forEach((char, offset) => {
      next[startIndex + offset] = char;
    });
    setDigits(next);
    focusIndex(startIndex + chars.length);
  }

  return (
    <div
      className="flex justify-center gap-2 sm:gap-2.5"
      role="group"
      aria-label="Email verification code"
    >
      {digits.map((digit, index) => (
        <input
          key={`${inputId}-${index}`}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={length}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          className={cn(
            "h-12 w-10 rounded-xl border bg-white text-center text-lg font-semibold text-zinc-900 shadow-none outline-none transition sm:h-14 sm:w-11 sm:text-xl",
            error
              ? "border-red-400 focus:border-red-500"
              : "border-zinc-200 hover:border-zinc-300 focus:border-brand",
            disabled && "cursor-not-allowed opacity-60",
          )}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "");
            if (!raw) {
              const next = [...digits];
              next[index] = "";
              setDigits(next);
              return;
            }
            if (raw.length > 1) {
              applyPaste(raw, index);
              return;
            }
            const next = [...digits];
            next[index] = raw;
            setDigits(next);
            if (index < length - 1) focusIndex(index + 1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              if (digits[index]) {
                const next = [...digits];
                next[index] = "";
                setDigits(next);
                return;
              }
              if (index > 0) {
                e.preventDefault();
                const next = [...digits];
                next[index - 1] = "";
                setDigits(next);
                focusIndex(index - 1);
              }
            } else if (e.key === "ArrowLeft" && index > 0) {
              e.preventDefault();
              focusIndex(index - 1);
            } else if (e.key === "ArrowRight" && index < length - 1) {
              e.preventDefault();
              focusIndex(index + 1);
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            applyPaste(e.clipboardData.getData("text"), index);
          }}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
