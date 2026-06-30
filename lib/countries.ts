export type CountryOption = {
  /** Full country name sent to the API (e.g. `United States`). */
  value: string;
  label: string;
};

/** Country names for onboarding (`country` form field), sorted A–Z. */
function buildCountryOptions(): CountryOption[] {
  if (typeof Intl === "undefined" || typeof Intl.DisplayNames !== "function") {
    return FALLBACK_COUNTRY_OPTIONS;
  }

  let codes: string[];
  try {
    codes =
      typeof Intl.supportedValuesOf === "function"
        ? (Intl.supportedValuesOf as unknown as (key: "region") => string[])("region")
        : FALLBACK_COUNTRY_OPTIONS.map((c) => c.value);
  } catch {
    return FALLBACK_COUNTRY_OPTIONS;
  }

  const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

  return codes
    .filter((code) => /^[A-Z]{2}$/.test(code))
    .map((code) => {
      const label = displayNames.of(code) ?? code;
      return { value: label, label };
    })
    .filter((opt) => Boolean(opt.label))
    .sort((a, b) => a.label.localeCompare(b.label, "en"));
}

/** Curated fallback when `Intl.supportedValuesOf` is unavailable (older runtimes). */
const FALLBACK_COUNTRY_OPTIONS: CountryOption[] = [
  { value: "Australia", label: "Australia" },
  { value: "Canada", label: "Canada" },
  { value: "Ghana", label: "Ghana" },
  { value: "India", label: "India" },
  { value: "Kenya", label: "Kenya" },
  { value: "Nigeria", label: "Nigeria" },
  { value: "South Africa", label: "South Africa" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "United States", label: "United States" },
];

export const COUNTRY_OPTIONS = buildCountryOptions();

/** Normalize API / draft country (full name or legacy ISO code) for the dropdown. */
export function parseCountryValue(raw?: string | null): string {
  const v = raw?.trim();
  if (!v) return "";
  const byName = COUNTRY_OPTIONS.find(
    (c) => c.value.localeCompare(v, "en", { sensitivity: "accent" }) === 0,
  );
  if (byName) return byName.value;
  const iso = v.toUpperCase();
  if (/^[A-Z]{2}$/.test(iso) && typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function") {
    const name = new Intl.DisplayNames(["en"], { type: "region" }).of(iso);
    if (name) {
      const match = COUNTRY_OPTIONS.find((c) => c.value === name);
      return match?.value ?? name;
    }
  }
  return v;
}
