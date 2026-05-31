/** Prefilled message body for sharing a client gallery link. */
export function buildGalleryShareMessage(
  title: string,
  url: string,
  clientName?: string,
): string {
  const galleryTitle = title.trim() || "your gallery";
  const name = clientName?.trim();
  if (name) {
    return `Hi ${name},\n\nYour gallery "${galleryTitle}" is ready to view:\n${url}`;
  }
  return `Your gallery "${galleryTitle}" is ready to view:\n${url}`;
}

export function buildMailtoShareUrl(options: {
  subject: string;
  body: string;
  to?: string;
}): string {
  const params = new URLSearchParams();
  if (options.to?.trim()) params.set("to", options.to.trim());
  params.set("subject", options.subject);
  params.set("body", options.body);
  const query = params.toString();
  const to = options.to?.trim() ?? "";
  return query ? `mailto:${to}?${query}` : `mailto:${to}`;
}

export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
