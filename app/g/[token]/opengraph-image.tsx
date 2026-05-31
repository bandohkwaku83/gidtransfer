import { galleryOpenGraphImageResponse } from "@/lib/gallery-opengraph-image";
import { publicGalleryKeyFromToken } from "@/lib/share-gallery-api";

export const runtime = "nodejs";
export const alt = "Gallery cover";
export const size = { width: 1200, height: 630 };

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const safe = token ?? "";
  let decoded = safe;
  try {
    decoded = decodeURIComponent(safe);
  } catch {
    decoded = safe;
  }
  return galleryOpenGraphImageResponse(publicGalleryKeyFromToken(decoded));
}
