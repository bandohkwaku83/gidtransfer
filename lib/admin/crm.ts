import adminApi from "./admin-client";
import type {
  CrmBooking,
  CrmStudioDetail,
  CrmStudioListItem,
  PaginatedResponse,
} from "@/lib/admin/types";

export async function getCrmStudios(params: {
  search?: string;
  ownerId?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResponse<CrmStudioListItem> & { note?: string }> {
  const { data } = await adminApi.get("/api/admin/crm/studios", { params });
  return data;
}

export async function getCrmStudio(
  userId: string,
  params: { includePii?: boolean; reason?: string } = {},
): Promise<CrmStudioDetail> {
  const { data } = await adminApi.get<CrmStudioDetail>(
    `/api/admin/crm/studios/${userId}`,
    { params },
  );
  return data;
}

export async function getCrmBookings(params: {
  ownerId?: string;
  dateFrom?: string;
  dateTo?: string;
  shootType?: string;
  category?: string;
  includePii?: boolean;
  reason?: string;
  page?: number;
  limit?: number;
} = {}): Promise<
  PaginatedResponse<CrmBooking> & { includePii: boolean }
> {
  const { data } = await adminApi.get("/api/admin/crm/bookings", { params });
  return data;
}
