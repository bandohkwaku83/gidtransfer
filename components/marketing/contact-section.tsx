"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Check,
  Clock3,
  Mail,
  MessageSquare,
} from "lucide-react";
import {
  buildContactMailto,
  contactEditorialImage,
  contactEmail,
  contactTopics,
  type ContactFormValues,
  type ContactTopicId,
} from "@/lib/marketing/contact";
import { MarketingCornerButton } from "@/components/marketing/marketing-corner-cta";
import { cn } from "@/lib/utils";

export const CONTACT_HERO_BACKDROP_ID = "contact-hero-backdrop";

export const contactHeroImage = {
  src: "/images/appointment.png",
  alt: "Photographer scheduling a client session",
} as const;

/** Full-bleed hero image from the top of the page — sits behind the marketing header. */
export function ContactHeroBackdrop() {
  return (
    <div
      id={CONTACT_HERO_BACKDROP_ID}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[max(32rem,calc(5.5rem+min(46vh,420px)))] sm:h-[max(36rem,calc(5.5rem+min(50vh,460px)))]"
    >
      <Image
        src={contactHeroImage.src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_35%]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/75" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />
    </div>
  );
}

const fieldClassName =
  "w-full rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm text-slate-900 shadow-none placeholder:text-slate-400 transition focus:border-[#55001F]/30 focus:outline-none focus:ring-2 focus:ring-[#55001F]/10";

const panelShellClassName =
  "overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white shadow-[0_28px_64px_-36px_rgba(15,23,42,0.22)]";

function ContactLinkRow() {
  const itemClassName =
    "flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_4px_20px_-12px_rgba(15,23,42,0.18)]";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
      <a
        href={`mailto:${contactEmail}`}
        className={cn(itemClassName, "group transition hover:border-[#55001F]/30 hover:shadow-[0_8px_24px_-12px_rgba(85,0,31,0.18)]")}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#55001F]/10 text-[#55001F]">
          <Mail className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Email
          </span>
          <span className="mt-0.5 block truncate text-base font-semibold text-slate-900 group-hover:text-[#55001F]">
            {contactEmail}
          </span>
        </span>
      </a>

      <div className={itemClassName}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#D5AE65]/20 text-[#55001F]">
          <Clock3 className="h-5 w-5" aria-hidden />
        </span>
        <span>
          <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Support
          </span>
          <span className="mt-0.5 block text-base font-semibold text-slate-900">24hrs support</span>
        </span>
      </div>
    </div>
  );
}

function EditorialAside() {
  return (
    <div className="relative hidden lg:block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[1.75rem] shadow-[0_28px_64px_-36px_rgba(15,23,42,0.28)]">
        <Image
          src={contactEditorialImage.src}
          alt={contactEditorialImage.alt}
          fill
          className="object-cover object-[center_20%]"
          sizes="(max-width: 1024px) 0vw, 360px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Built for photographers
          </p>
          <p className="mt-2 font-display text-xl font-medium leading-snug text-white">
            {contactEditorialImage.caption}
          </p>
        </div>
      </div>
    </div>
  );
}

function ContactMessageForm() {
  const [values, setValues] = useState<ContactFormValues>({
    name: "",
    email: "",
    studio: "",
    topic: "general",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    window.location.href = buildContactMailto(values);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-emerald-50/80 px-4 py-12 text-center ring-1 ring-emerald-100">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
          <Check className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="mt-4 font-display text-xl font-semibold text-slate-900">
          Opening your email app…
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
          Send the pre-filled message and we&apos;ll be in touch. 24hrs support.
        </p>
        <button
          type="button"
          className="mt-5 text-sm font-semibold text-[#55001F] underline underline-offset-2"
          onClick={() => setSubmitted(false)}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Name <span className="text-[#55001F]">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className={fieldClassName}
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email <span className="text-[#55001F]">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            className={fieldClassName}
            placeholder="you@studio.com"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-studio" className="mb-1.5 block text-sm font-medium text-slate-700">
            Studio name
          </label>
          <input
            id="contact-studio"
            name="studio"
            type="text"
            autoComplete="organization"
            value={values.studio}
            onChange={(e) => setValues((v) => ({ ...v, studio: e.target.value }))}
            className={fieldClassName}
            placeholder="Optional"
          />
        </div>
        <div>
          <label htmlFor="contact-topic" className="mb-1.5 block text-sm font-medium text-slate-700">
            Topic <span className="text-[#55001F]">*</span>
          </label>
          <select
            id="contact-topic"
            name="topic"
            required
            value={values.topic}
            onChange={(e) =>
              setValues((v) => ({ ...v, topic: e.target.value as ContactTopicId }))
            }
            className={cn(fieldClassName, "appearance-none bg-[length:1rem_1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10")}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            }}
          >
            {contactTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-slate-700">
          Message <span className="text-[#55001F]">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          value={values.message}
          onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
          className={cn(fieldClassName, "min-h-[8.5rem] resize-y")}
          placeholder="Tell us about your studio, current tools, or what you'd like to see…"
        />
      </div>

      <MarketingCornerButton type="submit" className="w-full justify-center">
        Send my message
      </MarketingCornerButton>
    </form>
  );
}

function ContactHeroCopy() {
  return (
    <section className="relative">
      <div className="relative flex min-h-[min(46vh,420px)] flex-col items-center justify-center px-5 py-12 text-center sm:min-h-[min(50vh,460px)] sm:px-8 sm:py-16">
        <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] font-medium tracking-tight text-white">
          Contact
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65 sm:text-base">
          Questions about galleries, pricing, or getting started? 24hrs support.
        </p>
      </div>
    </section>
  );
}

function ContactMainContent() {
  return (
    <section className="relative pb-16 pt-10 sm:pb-20 sm:pt-14">
      <div className="marketing-container">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-400">
            Get in touch
          </p>
          <h2 className="mt-4 font-display text-3xl font-normal leading-snug tracking-tight text-slate-900 sm:text-4xl">
            Send us a message
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
            Tell us about your studio and we&apos;ll point you to the right plan or next step.
          </p>
          <div className="mt-5 h-px w-10 bg-slate-200" aria-hidden />
          <div className="mt-6">
            <ContactLinkRow />
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10 xl:gap-14">
          <EditorialAside />

          <div className="min-w-0">
            <div className={panelShellClassName}>
              <div
                aria-hidden
                className="pointer-events-none h-px bg-gradient-to-r from-transparent via-[#D5AE65]/80 to-transparent"
              />

              <div className="border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
                <div className="flex items-center gap-2 text-[#55001F]">
                  <MessageSquare className="h-4 w-4" aria-hidden />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                    Write to us
                  </span>
                </div>
                <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  We&apos;re here to help
                </h3>
              </div>

              <div className="bg-[#fbf7ef]/35 px-5 py-6 sm:px-7 sm:py-7">
                <ContactMessageForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <>
      <ContactHeroCopy />
      <ContactMainContent />
    </>
  );
}
