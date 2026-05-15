"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getAuth } from "@/lib/auth-demo";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getAuth() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-50 px-6 dark:bg-zinc-950"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-8%,rgba(79,70,229,0.16),transparent_52%),radial-gradient(ellipse_50%_45%_at_100%_100%,rgba(99,102,241,0.09),transparent_48%)] dark:bg-[radial-gradient(ellipse_80%_55%_at_50%_-8%,rgba(99,102,241,0.2),transparent_52%),radial-gradient(ellipse_50%_45%_at_100%_100%,rgba(79,70,229,0.1),transparent_48%)]"
      />
      <div className="relative flex max-w-sm flex-col items-center gap-7 text-center">
        <Image
          src="/images/gido_logo.png"
          alt="Gido Studio"
          width={120}
          height={120}
          className="h-10 w-auto object-contain opacity-[0.97] dark:opacity-90"
          priority
        />
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="h-9 w-9 animate-spin text-brand dark:text-brand-on-dark"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
              Preparing your studio
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Opening your workspace—almost there…
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
