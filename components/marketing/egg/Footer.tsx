import Link from "next/link";
import { APP_NAME, FOOTER_DESCRIPTION } from "@/lib/branding";
import { Logo } from "./Icons";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Client galleries", href: "/features" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Start free", href: "/login?screen=signup" },
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-foreground/8 bg-cream pt-16 pb-10">
      <div className="container-x">
        <div className="mb-16 grid gap-10 md:grid-cols-4">
          <div>
            <Logo className="mb-4" />
            <p className="max-w-xs text-sm leading-relaxed text-[#6b5f64]">
              {FOOTER_DESCRIPTION}
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-xs uppercase tracking-wider text-[#6b5f64]">
                {col.title}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/80 transition hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-between gap-4 border-t border-foreground/8 pt-8 text-sm text-[#6b5f64] md:flex-row md:items-center">
          <p>
            © {year} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
