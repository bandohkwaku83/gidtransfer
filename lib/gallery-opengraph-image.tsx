import { ImageResponse } from "next/og";
import sharp from "sharp";
import { publicSiteOrigin } from "@/lib/client-gallery-link-metadata";
import {
  getShareGallery,
  resolvePublicGalleryKey,
  type PublicGalleryKey,
  ShareGalleryError,
} from "@/lib/share-gallery-api";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

function fallbackOgPng(title: string): Response {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0c0f",
          color: "#fafafa",
          fontSize: 54,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          padding: 72,
          textAlign: "center",
        }}
      >
        {title.slice(0, 120)}
      </div>
    ),
    { width: OG_WIDTH, height: OG_HEIGHT },
  );
}

async function jpegFromRemoteCover(imageUrl: string): Promise<Buffer | null> {
  const ctl = AbortSignal.timeout(12_000);
  const res = await fetch(imageUrl, { signal: ctl, cache: "no-store" });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  try {
    return await sharp(buf)
      .rotate()
      .resize(OG_WIDTH, OG_HEIGHT, {
        fit: "cover",
        position: sharp.strategy.attention,
      })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();
  } catch {
    return null;
  }
}

/**
 * ~1200×630 JPEG thumbnail for WhatsApp/iMessage/facebook crawlers — raw covers are often huge and
 * time out peer fetches → apps fall back to the web logo (`icon.png`).
 */
export async function galleryOpenGraphImageResponse(
  key: PublicGalleryKey | string,
): Promise<Response> {
  const resolved = resolvePublicGalleryKey(key);

  let coverUrl = "";
  let title = "Client gallery";

  try {
    const origin = await publicSiteOrigin();
    const gallery = await getShareGallery(resolved, undefined, { baseOrigin: origin });
    title = gallery.eventName?.trim() || title;
    coverUrl = gallery.coverImageUrl?.trim() ?? "";
  } catch (e) {
    if (!(e instanceof ShareGalleryError)) {
      console.warn("[gallery-opengraph-image] gallery load failed", e);
    }
  }

  if (!coverUrl) return fallbackOgPng(title);

  const jpeg = await jpegFromRemoteCover(coverUrl);
  if (!jpeg) return fallbackOgPng(title);

  const out = jpeg;
  return new Response(new Uint8Array(out), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
