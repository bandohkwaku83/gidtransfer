"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { settingsBillingPathFromAppQuery } from "@/lib/plan";

function BillingRedirect() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = settingsBillingPathFromAppQuery(searchParams.toString());
    window.location.replace(next);
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 px-4 text-center dark:bg-black">
      <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden />
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Opening billing…
      </p>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500 dark:bg-black">
          Loading…
        </div>
      }
    >
      <BillingRedirect />
    </Suspense>
  );
}
