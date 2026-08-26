"use client";

import { useState } from "react";
import { Mail, Minus, Plus } from "lucide-react";
import { contactEmail, faqs } from "@/lib/marketing/faqs";
import { SectionHeading } from "@/components/marketing/egg/SectionHeading";
import { MarketingCornerCta } from "@/components/marketing/marketing-corner-cta";
import { cn } from "@/lib/utils";

function FaqItem({
  index,
  question,
  answer,
  open,
  onToggle,
}: {
  index: number;
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  const number = String(index + 1).padStart(2, "0");

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border transition-all duration-300",
        open
          ? "border-[#55001F]/20 bg-white shadow-[0_16px_48px_-24px_rgba(85,0,31,0.18)] ring-1 ring-[#55001F]/10"
          : "border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:shadow-[0_12px_36px_-20px_rgba(15,23,42,0.12)]",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-4 p-5 text-left sm:gap-5 sm:p-6"
      >
        <span
          className={cn(
            "mt-0.5 shrink-0 font-mono text-[11px] font-medium tabular-nums tracking-wider transition-colors",
            open ? "text-[#55001F]" : "text-slate-400",
          )}
        >
          {number}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block font-display text-base leading-snug tracking-tight transition-colors sm:text-lg",
              open ? "font-semibold text-slate-900" : "font-medium text-slate-800",
            )}
          >
            {question}
          </span>
        </span>

        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300",
            open
              ? "bg-[#55001F] text-[#D5AE65] shadow-[0_4px_14px_-4px_rgba(85,0,31,0.45)]"
              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
          )}
          aria-hidden
        >
          {open ? <Minus className="h-4 w-4" strokeWidth={2.5} /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
        </span>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-slate-100 px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
            <p className="pl-8 text-sm leading-relaxed text-slate-600 sm:pl-9 sm:text-[0.9375rem] sm:leading-7">
              {answer}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function FaqHeader({ centered }: { centered: boolean }) {
  return (
    <SectionHeading
      align={centered ? "center" : "left"}
      label="FAQ"
      title="Answers photographers ask us"
      body="Commissions, branding, proofing, and how print fulfillment works — the questions we hear most from studios comparing gallery platforms."
    />
  );
}

function FaqEmailFooter() {
  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_32px_-20px_rgba(15,23,42,0.12)]">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3 sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#55001F]/8 text-[#55001F]">
            <Mail className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Still have questions?</p>
            <p className="mt-0.5 text-sm text-slate-500">We typically reply within one business day.</p>
          </div>
        </div>
        <MarketingCornerCta
          href={`mailto:${contactEmail}`}
          className="shrink-0 justify-center"
        >
          Email our team
        </MarketingCornerCta>
      </div>
    </div>
  );
}

type MarketingFaqSectionProps = {
  id?: string;
  variant?: "showcase" | "centered";
  showEmailFooter?: boolean;
  className?: string;
};

export function MarketingFaqSection({
  id = "faq",
  variant = "showcase",
  showEmailFooter = false,
  className,
}: MarketingFaqSectionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const isCentered = variant === "centered";

  const faqList = (
    <div className="flex flex-col gap-3">
      {faqs.map((faq, i) => (
        <FaqItem
          key={faq.question}
          index={i}
          question={faq.question}
          answer={faq.answer}
          open={openFaq === i}
          onToggle={() => setOpenFaq(openFaq === i ? null : i)}
        />
      ))}
    </div>
  );

  return (
    <section id={id} className={cn("relative scroll-mt-24 py-16 sm:py-20", className)}>
      <div className="marketing-container">
        {isCentered ? (
          <div className="mx-auto max-w-3xl">
            <FaqHeader centered />
            <div className="mt-8 sm:mt-10">{faqList}</div>
            {showEmailFooter ? <FaqEmailFooter /> : null}
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start lg:gap-14 xl:gap-20">
            <div className="lg:sticky lg:top-24">
              <FaqHeader centered={false} />
            </div>
            <div className="mt-8 lg:mt-0">
              {faqList}
              {showEmailFooter ? <FaqEmailFooter /> : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
