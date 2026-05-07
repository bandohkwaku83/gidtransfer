import { galleryOpenGraphImageResponse } from "@/lib/gallery-opengraph-image";

export const runtime = "nodejs";
export const alt = "Gallery cover";
export const size = { width: 1200, height: 630 };

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return galleryOpenGraphImageResponse(token ?? "");
}
