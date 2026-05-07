import { galleryOpenGraphImageResponse } from "@/lib/gallery-opengraph-image";

export const runtime = "nodejs";
export const alt = "Gallery cover";
export const size = { width: 1200, height: 630 };

/** Same optimized JPEG as `/g/:token` so legacy `/share/:code` links get a workable preview asset. */
export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return galleryOpenGraphImageResponse(code ?? "");
}
