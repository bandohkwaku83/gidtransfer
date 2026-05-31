import { galleryOpenGraphImageResponse } from "@/lib/gallery-opengraph-image";
import { publicGalleryKeyFromSlugs } from "@/lib/share-gallery-api";

export const runtime = "nodejs";
export const alt = "Gallery cover";
export const size = { width: 1200, height: 630 };

export default async function Image({
  params,
}: {
  params: Promise<{ companySlug: string; gallerySlug: string }>;
}) {
  const { companySlug, gallerySlug } = await params;
  const key = publicGalleryKeyFromSlugs(companySlug ?? "", gallerySlug ?? "");
  return galleryOpenGraphImageResponse(key);
}
