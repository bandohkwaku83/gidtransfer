"use client";

import { use } from "react";
import { ClientDetailView } from "@/components/photographer/client-detail-view";

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ClientDetailView key={id} clientId={id} />;
}
