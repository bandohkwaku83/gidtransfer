import adminApi from "./admin-client";
import type {
  IssueReportsResponse,
  UpdateIssueReportResponse,
} from "@/lib/admin/types";

export async function getIssueReports(
  params: {
    status?: string;
    topic?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<IssueReportsResponse> {
  const { status, topic, search, page, limit } = params;
  const { data } = await adminApi.get<IssueReportsResponse>(
    "/api/admin/issue-reports",
    {
      params: {
        ...(status ? { status } : {}),
        ...(topic ? { topic } : {}),
        ...(search ? { search } : {}),
        ...(page ? { page } : {}),
        ...(limit ? { limit } : {}),
      },
    },
  );
  return data;
}

export async function updateIssueReport(
  id: string,
  body: { status: "open" | "resolved" },
): Promise<UpdateIssueReportResponse> {
  const { data } = await adminApi.patch<UpdateIssueReportResponse>(
    `/api/admin/issue-reports/${id}`,
    body,
  );
  return data;
}
