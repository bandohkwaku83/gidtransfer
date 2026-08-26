import Link from "next/link";
import type { LegalDocument } from "@/lib/marketing/legal";
import { legalLastUpdated } from "@/lib/marketing/legal";

/** Dark blur band behind the marketing header on legal pages — sized to the header row only. */
export function LegalHeaderBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[5rem] sm:h-[5.5rem] lg:h-[6rem]"
    >
      <div className="absolute inset-0 border-b border-white/10 bg-black/55 backdrop-blur-xl backdrop-saturate-150" />
    </div>
  );
}

type LegalDocumentSectionProps = {
  document: LegalDocument;
  alternate?: {
    label: string;
    href: string;
  };
};

export function LegalDocumentSection({ document, alternate }: LegalDocumentSectionProps) {
  return (
    <section className="pb-16 pt-28 sm:pb-20 sm:pt-32">
      <div className="marketing-container">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/90 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#55001F]/70">
                Legal
              </p>
              <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                {document.title}
              </h1>
              <p className="mt-2 text-sm text-slate-500">Last updated: {legalLastUpdated}</p>
            </div>
            {alternate ? (
              <Link
                href={alternate.href}
                className="text-sm font-medium text-[#55001F] underline-offset-4 hover:underline"
              >
                {alternate.label}
              </Link>
            ) : null}
          </div>

          <div className="space-y-8 text-sm leading-7 text-slate-700 sm:text-[0.9375rem] sm:leading-7">
            <p className="text-base leading-7 text-slate-700">{document.intro}</p>

            {document.sections.map((section) => (
              <article key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="font-serif text-xl font-semibold tracking-tight text-slate-900">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                  {section.list ? (
                    <ul className="list-disc space-y-2 pl-5 marker:text-[#55001F]/70">
                      {section.list.map((item) => (
                        <li key={item.slice(0, 48)}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
