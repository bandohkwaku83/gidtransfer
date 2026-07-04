"use client";

import dynamic from "next/dynamic";
import { FolderDetailPageSkeleton } from "@/components/ui/skeletons";

export const LazyFolderDetailView = dynamic(
  () =>
    import("@/components/photographer/folder-detail-view").then((m) => ({
      default: m.FolderDetailView,
    })),
  {
    loading: () => <FolderDetailPageSkeleton />,
  },
);

export const LazyMediaLightbox = dynamic(
  () =>
    import("@/components/ui/media-lightbox").then((m) => ({
      default: m.MediaLightbox,
    })),
  { ssr: false },
);

export const LazyGalleryBlogClientSection = dynamic(
  () =>
    import("@/components/gallery-blog/gallery-blog-client-section").then((m) => ({
      default: m.GalleryBlogClientSection,
    })),
  { ssr: false },
);
