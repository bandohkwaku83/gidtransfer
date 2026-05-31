"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { InputRef } from "antd/es/input";
import { Check, ChevronDown, Search } from "lucide-react";
import { FormSearchInput } from "@/components/ui/form-input";
import { formModalInputClass } from "@/components/ui/form-modal";
import type { ApiClient } from "@/lib/clients-api";
import { cn } from "@/lib/utils";

function clientMatchesQuery(c: ApiClient, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    c.name.toLowerCase().includes(s) ||
    c.email.toLowerCase().includes(s) ||
    c.contact.toLowerCase().includes(s) ||
    c.location.toLowerCase().includes(s)
  );
}

function clientSubtitle(c: ApiClient): string {
  const parts = [c.contact, c.email, c.location].map((x) => x?.trim()).filter(Boolean);
  return parts[0] ?? "";
}

type ClientSearchSelectProps = {
  clients: ApiClient[];
  value: string;
  onChange: (clientId: string) => void;
  loading?: boolean;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
};

export function ClientSearchSelect({
  clients,
  value,
  onChange,
  loading,
  disabled,
  id: idProp,
  placeholder = "Search and select a client…",
  className,
}: ClientSearchSelectProps) {
  const autoId = useId();
  const listboxId = `${idProp ?? autoId}-listbox`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<InputRef>(null);
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const selected = useMemo(
    () => clients.find((c) => c._id === value) ?? null,
    [clients, value],
  );

  const filtered = useMemo(() => {
    const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name));
    return sorted.filter((c) => clientMatchesQuery(c, query));
  }, [clients, query]);

  useEffect(() => {
    if (!open) {
      setPanelStyle(null);
      return;
    }
    function positionPanel() {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPanelStyle({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
    positionPanel();
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function selectClient(clientId: string) {
    onChange(clientId);
    setOpen(false);
    setQuery("");
  }

  const busy = loading || disabled;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        id={idProp}
        disabled={busy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          if (busy) return;
          setOpen((o) => !o);
        }}
        className={cn(
          formModalInputClass,
          "mt-0 flex items-center justify-between gap-2 text-left",
          !selected && "text-zinc-400 dark:text-zinc-500",
          open && "border-brand ring-2 ring-brand/20",
        )}
      >
        <span className="min-w-0 truncate">
          {loading
            ? "Loading clients…"
            : selected
              ? selected.name
              : placeholder}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-zinc-400 transition", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && panelStyle ? (
        <div
          className="fixed z-[80] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg ring-1 ring-zinc-900/5 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-white/10"
          style={{
            top: panelStyle.top,
            left: panelStyle.left,
            width: panelStyle.width,
          }}
          role="presentation"
        >
          <div className="border-b border-zinc-100 p-2 dark:border-zinc-800">
            <FormSearchInput
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or phone…"
              prefix={<Search className="h-4 w-4 text-zinc-400" aria-hidden />}
              aria-label="Search clients"
              className="[&_.ant-input-affix-wrapper]:!rounded-lg [&_.ant-input-affix-wrapper]:!bg-zinc-50 [&_.ant-input-affix-wrapper]:!py-1.5 dark:[&_.ant-input-affix-wrapper]:!bg-zinc-900"
            />
          </div>
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Clients"
            className="max-h-52 overflow-y-auto overscroll-contain py-1 [scrollbar-width:thin]"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                {clients.length === 0 ? "No clients yet." : "No clients match your search."}
              </li>
            ) : (
              filtered.map((c) => {
                const active = c._id === value;
                const sub = clientSubtitle(c);
                return (
                  <li key={c._id} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => selectClient(c._id)}
                      className={cn(
                        "flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition",
                        active
                          ? "bg-brand/10 text-brand-ink dark:bg-brand/20 dark:text-brand-on-dark"
                          : "text-zinc-800 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-900",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{c.name}</span>
                        {sub ? (
                          <span className="mt-0.5 block truncate text-xs font-normal text-zinc-500 dark:text-zinc-400">
                            {sub}
                          </span>
                        ) : null}
                      </span>
                      {active ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand dark:text-brand-on-dark" aria-hidden />
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
