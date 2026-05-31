import type { Metadata } from "next";
import { buildClientGallerySlugMetadata } from "@/lib/client-gallery-link-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companySlug: string; gallerySlug: string }>;
}): Promise<Metadata> {
  const { companySlug, gallerySlug } = await params;
  return buildClientGallerySlugMetadata(companySlug ?? "", gallerySlug ?? "");
}

export default function ClientGallerySlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
