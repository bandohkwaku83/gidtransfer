"use client";

import Link from "next/link";
import { useMarketingAuthCta } from "@/lib/marketing/use-photographer-signed-in";

/** Footer account links that resume signup / onboarding / studio when a session exists. */
export function MarketingFooterAccountLinks() {
  const { signInHref, signUpHref, primaryCtaLabel, signedIn } = useMarketingAuthCta();

  return (
    <ul className="space-y-2.5">
      <li>
        <Link
          href={signInHref}
          className="text-sm text-foreground/80 transition hover:text-foreground"
        >
          {signedIn ? "Open studio" : "Sign in"}
        </Link>
      </li>
      <li>
        <Link
          href={signUpHref}
          className="text-sm text-foreground/80 transition hover:text-foreground"
        >
          {primaryCtaLabel}
        </Link>
      </li>
      <li>
        <Link
          href="/terms"
          className="text-sm text-foreground/80 transition hover:text-foreground"
        >
          Terms
        </Link>
      </li>
      <li>
        <Link
          href="/privacy"
          className="text-sm text-foreground/80 transition hover:text-foreground"
        >
          Privacy
        </Link>
      </li>
    </ul>
  );
}
