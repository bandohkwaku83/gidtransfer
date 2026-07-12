"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Flex, Input, Select, Table } from "antd";
import type { TableColumnsType } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { getPhotographers } from "@/lib/admin/photographers";
import { getErrorMessage } from "@/lib/admin/admin-client";
import type { PhotographerListItem } from "@/lib/admin/types";
import { StatusChip } from "@/components/admin/ui/StatusChip";
import { formatRelative } from "@/lib/admin/format";
import { PageHeader } from "@/components/admin/ui/PageHeader";

function PhotographersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<PhotographerListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const filters = {
    search: searchParams.get("search") ?? "",
    onboarded: searchParams.get("onboarded") ?? "",
    emailVerified: searchParams.get("emailVerified") ?? "",
    isActive: searchParams.get("isActive") ?? "",
    planId: searchParams.get("planId") ?? "",
    subscriptionStatus: searchParams.get("subscriptionStatus") ?? "",
    smsSenderStatus: searchParams.get("smsSenderStatus") ?? "",
    authProvider: searchParams.get("authProvider") ?? "",
    sort: searchParams.get("sort") ?? "lastLoginAt",
    order: (searchParams.get("order") ?? "desc") as "asc" | "desc",
    page: Number(searchParams.get("page") ?? 1),
    limit: 50,
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(filters.search);

  useEffect(() => {
    setSearch(filters.search);
  }, [filters.search]);

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.onboarded ||
      filters.emailVerified ||
      filters.isActive ||
      filters.subscriptionStatus ||
      filters.smsSenderStatus,
  );

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    [
      "search",
      "onboarded",
      "emailVerified",
      "isActive",
      "subscriptionStatus",
      "smsSenderStatus",
      "page",
    ].forEach((key) => params.delete(key));
    router.push(`/admin/photographers?${params.toString()}`);
  }, [router, searchParams]);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`/admin/photographers?${params.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    setLoading(true);
    getPhotographers(filters)
      .then((data) => {
        setItems(data.items);
        setPagination(data.pagination);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const columns: TableColumnsType<PhotographerListItem> = useMemo(
    () => [
      {
        title: "Account",
        dataIndex: "accountId",
        key: "accountId",
        render: (accountId: string) => (
          <span className="font-mono text-xs">{accountId}</span>
        ),
      },
      {
        title: "Studio",
        dataIndex: "companyName",
        key: "companyName",
        render: (companyName: string) => companyName || "—",
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        render: (email: string, record) => (
          <div className="flex items-center gap-2">
            {email}
            {record.emailVerified ? (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">
                verified
              </span>
            ) : (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                unverified
              </span>
            )}
          </div>
        ),
      },
      {
        title: "Plan",
        dataIndex: "planName",
        key: "planName",
        render: (planName: string) => planName || "—",
      },
      {
        title: "Activity",
        dataIndex: "lastLoginAt",
        key: "activity",
        render: (lastLoginAt: string | null) => (
          <span className="text-xs">{formatRelative(lastLoginAt)}</span>
        ),
      },
      {
        title: "Status",
        key: "status",
        render: (_, record) => (
          <StatusChip status={record.isActive ? "active" : "inactive"} />
        ),
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Link
            href={`/admin/photographers/${record.userId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            View
          </Link>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Photographers"
        description="Browse and manage photographer accounts"
      />

      <div className="space-y-10">
        <Card bordered={false} className="shadow-sm">
        <Flex vertical gap={16}>
          <Input.Search
            allowClear
            size="large"
            placeholder="Search email, account ID, company…"
            prefix={<SearchOutlined className="text-slate-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={(value) => updateFilter("search", value)}
            onClear={() => updateFilter("search", "")}
          />

          <Flex wrap gap={12} align="center">
            <Select
              allowClear
              placeholder="Onboarded"
              style={{ minWidth: 150 }}
              value={filters.onboarded || undefined}
              onChange={(value) => updateFilter("onboarded", value ?? "")}
              options={[
                { value: "true", label: "Onboarded" },
                { value: "false", label: "Not onboarded" },
              ]}
            />

            <Select
              allowClear
              placeholder="Email verification"
              style={{ minWidth: 170 }}
              value={filters.emailVerified || undefined}
              onChange={(value) => updateFilter("emailVerified", value ?? "")}
              options={[
                { value: "true", label: "Verified" },
                { value: "false", label: "Unverified" },
              ]}
            />

            <Select
              allowClear
              placeholder="Account status"
              style={{ minWidth: 150 }}
              value={filters.isActive || undefined}
              onChange={(value) => updateFilter("isActive", value ?? "")}
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
            />

            <Select
              allowClear
              placeholder="Subscription"
              style={{ minWidth: 150 }}
              value={filters.subscriptionStatus || undefined}
              onChange={(value) =>
                updateFilter("subscriptionStatus", value ?? "")
              }
              options={[
                { value: "free", label: "Free" },
                { value: "active", label: "Active" },
                { value: "pending", label: "Pending" },
                { value: "cancelled", label: "Cancelled" },
                { value: "expired", label: "Expired" },
              ]}
            />

            <Select
              allowClear
              placeholder="SMS sender"
              style={{ minWidth: 150 }}
              value={filters.smsSenderStatus || undefined}
              onChange={(value) =>
                updateFilter("smsSenderStatus", value ?? "")
              }
              options={[
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
              ]}
            />

            <Select
              placeholder="Sort by"
              style={{ minWidth: 190 }}
              value={`${filters.sort}:${filters.order}`}
              onChange={(value) => {
                const [sort, order] = value.split(":");
                const params = new URLSearchParams(searchParams.toString());
                params.set("sort", sort);
                params.set("order", order);
                params.delete("page");
                router.push(`/admin/photographers?${params.toString()}`);
              }}
              options={[
                { value: "lastLoginAt:desc", label: "Last login (newest)" },
                { value: "lastLoginAt:asc", label: "Last login (oldest)" },
                { value: "createdAt:desc", label: "Created (newest)" },
                { value: "createdAt:asc", label: "Created (oldest)" },
                { value: "companyName:asc", label: "Company A–Z" },
                { value: "companyName:desc", label: "Company Z–A" },
              ]}
            />

            {hasActiveFilters && (
              <Button type="link" onClick={clearFilters} className="px-0">
                Clear filters
              </Button>
            )}
          </Flex>
        </Flex>
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Card bordered={false} className="shadow-sm">
        <Table<PhotographerListItem>
        rowKey="userId"
        columns={columns}
        dataSource={items}
        loading={loading}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "No photographers found" }}
        onRow={(record) => ({
          onClick: () => router.push(`/admin/photographers/${record.userId}`),
          style: { cursor: "pointer" },
        })}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: false,
          showTotal: (total, range) =>
            total === 0 ? "No results" : `${range[0]}–${range[1]} of ${total}`,
          onChange: (page) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", String(page));
            router.push(`/admin/photographers?${params.toString()}`);
          },
        }}
        />
        </Card>
      </div>
    </div>
  );
}

export default function PhotographersPage() {
  return (
    <Suspense
      fallback={
        <div className="h-64 animate-pulse rounded-xl bg-zinc-200" />
      }
    >
      <PhotographersContent />
    </Suspense>
  );
}
