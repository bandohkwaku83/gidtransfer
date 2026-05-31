/** Generate a random 4-digit gallery access code (0000–9999). */
export function generateGalleryAccessPin(): string {
  return String(Math.floor(Math.random() * 10_000)).padStart(4, "0");
}

/** Split a pin into four single-character digits for display. */
export function galleryAccessPinDigits(pin: string): [string, string, string, string] {
  const normalized = pin.replace(/\D/g, "").padStart(4, "0").slice(-4);
  return [normalized[0]!, normalized[1]!, normalized[2]!, normalized[3]!];
}
