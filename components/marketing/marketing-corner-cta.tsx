import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Features-page "Start free" look: sharp burgundy block, cream type,
 * leading square, and corner brackets.
 */
export const marketingPrimaryCtaClassName =
  "group relative inline-flex items-center gap-2.5 bg-[#55001F] px-4 py-2.5 text-sm font-medium text-[#FFFCF2] transition hover:bg-[#6a0027]";

/** Outline / secondary CTA for dark heroes */
export const marketingSecondaryCtaClassName =
  "group relative inline-flex items-center justify-center border border-[#D5AE65]/80 px-4 py-2.5 text-sm font-medium text-[#D5AE65] transition hover:border-[#D5AE65] hover:bg-[#D5AE65]/10";

/** Gold fill on maroon sections where a burgundy button would disappear */
export const marketingInverseCtaClassName =
  "group relative inline-flex items-center gap-2.5 bg-[#D5AE65] px-4 py-2.5 text-sm font-medium text-[#55001F] transition hover:bg-[#e0be75]";

function CornerBrackets({ className }: { className?: string }) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -left-1.5 -top-1.5 h-3 w-3 border-l border-t",
          className,
        )}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-1.5 -top-1.5 h-3 w-3 border-r border-t",
          className,
        )}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -bottom-1.5 -left-1.5 h-3 w-3 border-b border-l",
          className,
        )}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -bottom-1.5 -right-1.5 h-3 w-3 border-b border-r",
          className,
        )}
      />
    </>
  );
}

function LeadingSquare({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "h-2.5 w-2.5 shrink-0 bg-[#FFFCF2] transition group-hover:bg-white",
        className,
      )}
    />
  );
}

type MarketingCornerCtaProps = {
  href: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  /** Show the small leading square (default true for primary CTAs) */
  showSquare?: boolean;
  /** Bracket / square colors for inverse (gold) buttons */
  tone?: "primary" | "inverse" | "secondary";
};

export function MarketingCornerCta({
  href,
  children,
  onClick,
  className,
  showSquare = true,
  tone = "primary",
}: MarketingCornerCtaProps) {
  const base =
    tone === "inverse"
      ? marketingInverseCtaClassName
      : tone === "secondary"
        ? marketingSecondaryCtaClassName
        : marketingPrimaryCtaClassName;

  const bracketClass =
    tone === "inverse"
      ? "border-[#D5AE65]/70"
      : tone === "secondary"
        ? "border-[#D5AE65]/55"
        : "border-[#55001F]/45";

  const squareClass =
    tone === "inverse" ? "bg-[#55001F] group-hover:bg-[#440019]" : undefined;

  const content = (
    <>
      {showSquare && tone !== "secondary" ? (
        <LeadingSquare className={squareClass} />
      ) : null}
      {children}
      <CornerBrackets className={bracketClass} />
    </>
  );

  const classes = cn(base, className);
  const isExternal =
    href.startsWith("mailto:") ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("tel:");

  if (isExternal) {
    return (
      <a href={href} onClick={onClick} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={classes}>
      {content}
    </Link>
  );
}

type MarketingCornerButtonProps = {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
  onClick?: () => void;
  showSquare?: boolean;
};

/** Same visual as MarketingCornerCta, for <button> (forms). */
export function MarketingCornerButton({
  children,
  type = "button",
  className,
  onClick,
  showSquare = true,
}: MarketingCornerButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(marketingPrimaryCtaClassName, className)}
    >
      {showSquare ? <LeadingSquare /> : null}
      {children}
      <CornerBrackets className="border-[#55001F]/45" />
    </button>
  );
}
