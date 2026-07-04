"use client";

import { use } from "react";
import { LazyFolderDetailView } from "@/lib/lazy-components";

export default function FolderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <LazyFolderDetailView key={id} folderId={id} />;
}
