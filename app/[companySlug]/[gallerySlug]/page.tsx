"use client";

import { useParams } from "next/navigation";
import { ClientGalleryApp } from "@/components/client/client-gallery-app";
import {
  publicGalleryKeyFromSlugs,
  publicGallerySessionId,
} from "@/lib/share-gallery-api";

export default function ClientGallerySlugPage() {
  const params = useParams();
  const rawCompany = params?.companySlug;
  const rawGallery = params?.gallerySlug;
  const companySlug = Array.isArray(rawCompany) ? rawCompany[0] : rawCompany;
  const gallerySlug = Array.isArray(rawGallery) ? rawGallery[0] : rawGallery;

  if (
    !companySlug ||
    !gallerySlug ||
    typeof companySlug !== "string" ||
    typeof gallerySlug !== "string"
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 text-center dark:bg-black">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">This gallery link is invalid.</p>
      </div>
    );
  }

  let safeCompany = companySlug;
  let safeGallery = gallerySlug;
  try {
    safeCompany = decodeURIComponent(companySlug);
    safeGallery = decodeURIComponent(gallerySlug);
  } catch {
    safeCompany = companySlug;
    safeGallery = gallerySlug;
  }

  const publicKey = publicGalleryKeyFromSlugs(safeCompany, safeGallery);
  return (
    <ClientGalleryApp
      key={publicGallerySessionId(publicKey)}
      publicKey={publicKey}
    />
  );
}
