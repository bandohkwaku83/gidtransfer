"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, Mail, Phone } from "lucide-react";
import {
  buildContactMailto,
  contactEmail,
  contactPhone,
  contactPhoneHref,
  type ContactFormValues,
} from "@/lib/marketing/contact";
import { cn } from "@/lib/utils";

const contactHeroImage = {
  src: "/images/contact-image.jpeg",
  alt: "Hand using a phone beside a laptop on a desk",
} as const;

const fieldClassName =
  "w-full rounded-[0.9rem] border-0 bg-[#e9e9e9] px-4 py-3.5 text-[0.95rem] text-[#1a1216] shadow-none placeholder:text-[#1a1216]/35 transition focus:bg-[#e4e4e4] focus:outline-none focus:ring-2 focus:ring-[#55001F]/20";

const labelClassName =
  "mb-2.5 block text-[0.65rem] font-medium uppercase tracking-[0.16em] text-[#1a1216]/40";

function ContactMessageForm() {
  const [values, setValues] = useState<ContactFormValues>({
    name: "",
    email: "",
    studio: "",
    role: "",
    message: "",
    scheduleCall: false,
  });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    window.location.href = buildContactMailto(values);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center px-2 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#55001F]/10 text-[#55001F]">
          <Check className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="mt-4 text-xl font-medium text-[#1a1216]">
          Opening your email app…
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#1a1216]/55">
          Send the pre-filled message and we&apos;ll get back within 1–2 business
          days.
        </p>
        <button
          type="button"
          className="mt-5 text-sm font-medium text-[#55001F] underline underline-offset-2"
          onClick={() => setSubmitted(false)}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="contact-name" className={labelClassName}>
          Your name
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
          placeholder="Jessica Mercedes"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-studio" className={labelClassName}>
            Company / team name
          </label>
          <input
            id="contact-studio"
            name="studio"
            type="text"
            autoComplete="organization"
            value={values.studio}
            onChange={(e) => setValues((v) => ({ ...v, studio: e.target.value }))}
            className={fieldClassName}
            placeholder="Studio name"
          />
        </div>
        <div>
          <label htmlFor="contact-role" className={labelClassName}>
            Your role
          </label>
          <input
            id="contact-role"
            name="role"
            type="text"
            autoComplete="organization-title"
            value={values.role}
            onChange={(e) => setValues((v) => ({ ...v, role: e.target.value }))}
            className={fieldClassName}
            placeholder="Photographer"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-email" className={labelClassName}>
          Email address
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
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClassName}>
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          value={values.message}
          onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
          className={cn(fieldClassName, "min-h-[9rem] resize-y")}
          placeholder="Tell us what you're reaching out about — support request, billing question, studio setup, or general feedback."
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3 pt-1">
        <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={values.scheduleCall}
            onChange={(e) =>
              setValues((v) => ({ ...v, scheduleCall: e.target.checked }))
            }
            className="peer absolute inset-0 cursor-pointer opacity-0"
          />
          <span className="h-5 w-5 rounded-full border border-[#1a1216]/25 transition peer-checked:border-[#55001F] peer-checked:bg-[#55001F] peer-checked:shadow-[inset_0_0_0_3px_white] peer-focus-visible:ring-2 peer-focus-visible:ring-[#55001F]/25" />
        </span>
        <span className="text-[0.95rem] leading-snug text-[#1a1216]/65">
          I&apos;d like to schedule a call instead of email follow-up
        </span>
      </label>

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-[#231519] px-7 py-3.5 text-sm font-medium text-white transition hover:bg-[#2e1c22]"
      >
        Send message
      </button>
    </form>
  );
}

function InfoCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
      <a
        href={`mailto:${contactEmail}`}
        className="group flex items-center gap-3.5 rounded-[1.35rem] bg-white px-5 py-4 transition hover:-translate-y-0.5 sm:px-6 sm:py-5"
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3e8eb] text-[#55001F] transition group-hover:bg-[#55001F] group-hover:text-white">
          <Mail className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 truncate text-[0.98rem] font-semibold tracking-tight text-[#1a1216]">
          {contactEmail}
        </span>
      </a>

      <a
        href={contactPhoneHref}
        className="group flex items-center gap-3.5 rounded-[1.35rem] bg-white px-5 py-4 transition hover:-translate-y-0.5 sm:px-6 sm:py-5"
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eceaea] text-[#1a1216]/55 transition group-hover:bg-[#55001F] group-hover:text-white">
          <Phone className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 truncate text-[0.98rem] font-semibold tracking-tight text-[#1a1216]">
          {contactPhone}
        </span>
      </a>
    </div>
  );
}

export function ContactSection() {
  return (
    <div className="bg-[#f0eeed]">
      {/* Hero band with photo + wine overlay */}
      <section className="relative overflow-hidden pt-32 pb-40 sm:pt-36 sm:pb-48">
        <Image
          src={contactHeroImage.src}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[#231519]/82"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-[#231519]/40 via-transparent to-[#231519]/90"
        />

        <div className="relative z-10 mx-auto max-w-3xl px-5 text-center sm:px-8">
          <p className="inline-flex items-center gap-2 text-[0.9rem] text-white/70">
            <span className="inline-block h-2 w-2 rounded-[3px] bg-brand" />
            Contact
          </p>
          <h1 className="mt-7 font-sentient text-[2.5rem] font-light leading-[1.15] tracking-[-0.03em] text-white sm:text-[3.25rem] md:text-[3.75rem]">
            Let&apos;s solve the hard
            <br />
            <em className="italic-sentient">problems</em>{" "}
            <span className="not-italic">together</span>
          </h1>
        </div>
      </section>

      {/* Floating form + info cards on light ground */}
      <section className="relative z-10 -mt-28 px-4 pb-20 sm:-mt-32 sm:px-6 sm:pb-28">
        <div className="mx-auto max-w-[40rem]">
          <div className="rounded-[1.75rem] bg-white px-6 py-9 shadow-[0_28px_80px_-20px_rgba(0,0,0,0.35)] sm:rounded-[2rem] sm:px-10 sm:py-11 md:px-12">
            <h2 className="text-[1.65rem] font-medium tracking-tight text-[#1a1216] sm:text-[1.85rem]">
              Get in touch
            </h2>
            <p className="mt-2 text-[0.98rem] text-[#1a1216]/50">
              We&apos;ll get back to you within 1–2 business days.
            </p>
            <div className="mt-9">
              <ContactMessageForm />
            </div>
          </div>

          <div className="mt-5 sm:mt-6">
            <InfoCards />
          </div>
        </div>
      </section>
    </div>
  );
}
