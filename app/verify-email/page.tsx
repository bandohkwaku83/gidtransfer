"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { verifyEmailPath } from "@/lib/auth-api";

/** Legacy route — verification now lives on `/login?screen=verify`. */
export default function VerifyEmailRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(verifyEmailPath());
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-soft text-sm text-zinc-600">
      Loading…
    </div>
  );
}
