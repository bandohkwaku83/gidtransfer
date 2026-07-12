"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Progress,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  Flex,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  ArrowLeftOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  MailOutlined,
  MessageOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  getPhotographer,
  activatePhotographer,
  deactivatePhotographer,
  verifyPhotographerEmail,
  communicate,
} from "@/lib/admin/photographers";
import { getCommunicationsConfig } from "@/lib/admin/communications";
import { getErrorMessage } from "@/lib/admin/admin-client";
import type {
  CommunicationConfig,
  PhotographerDetail,
  Session,
} from "@/lib/admin/types";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { ComposeDrawer } from "@/components/admin/ui/ComposeDrawer";
import { formatDateTime, truncate } from "@/lib/admin/format";
import { useToast } from "@/lib/admin/use-admin-toast";

const { Title, Text } = Typography;

function statusTagColor(status: string) {
  const normalized = status?.toLowerCase() ?? "";
  if (["active", "approved", "sent", "resolved"].includes(normalized)) {
    return "success";
  }
  if (["pending", "open"].includes(normalized)) {
    return "warning";
  }
  if (["inactive", "rejected", "failed", "cancelled", "expired"].includes(normalized)) {
    return "error";
  }
  return "default";
}

export default function PhotographerDetailPage() {
  const router = useRouter();
  const { userId } = useParams<{ userId: string }>();
  const { toast } = useToast();
  const [photographer, setPhotographer] = useState<PhotographerDetail | null>(
    null,
  );
  const [config, setConfig] = useState<CommunicationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState<
    "deactivate" | "activate" | "verify-email" | null
  >(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getPhotographer(userId), getCommunicationsConfig()])
      .then(([detail, commConfig]) => {
        setPhotographer(detail);
        setConfig(commConfig);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [userId]);

  const handleConfirmAction = async () => {
    if (!photographer || !confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction === "activate") {
        await activatePhotographer(userId);
        toast("Account activated");
      } else if (confirmAction === "deactivate") {
        await deactivatePhotographer(userId);
        toast("Account deactivated");
      } else if (confirmAction === "verify-email") {
        await verifyPhotographerEmail(userId);
        toast("Email marked as verified");
      }
      setConfirmAction(null);
      load();
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommunicate = async (data: {
    channel: "sms" | "email" | "both";
    subject: string;
    message: string;
  }) => {
    const result = await communicate(userId, data);
    toast(`Sent to ${result.sent} recipient(s)`);
    if (result.failed > 0) {
      toast(`${result.failed} failed`, "error");
    }
  };

  const sessionColumns: TableColumnsType<Session> = useMemo(
    () => [
      {
        title: "Method",
        dataIndex: "authMethod",
        key: "authMethod",
      },
      {
        title: "IP",
        dataIndex: "ip",
        key: "ip",
        render: (ip: string) => <Text code>{ip}</Text>,
      },
      {
        title: "Agent",
        dataIndex: "userAgent",
        key: "userAgent",
        ellipsis: true,
        render: (userAgent: string) => truncate(userAgent, 50),
      },
      {
        title: "Last seen",
        dataIndex: "lastSeenAt",
        key: "lastSeenAt",
        render: (value: string) => formatDateTime(value),
      },
      {
        title: "Status",
        dataIndex: "isActive",
        key: "isActive",
        render: (isActive: boolean) => (
          <Tag color={isActive ? "success" : "default"}>
            {isActive ? "Active" : "Inactive"}
          </Tag>
        ),
      },
    ],
    [],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton.Button active size="small" />
        <Card bordered={false} className="shadow-sm">
          <Skeleton active avatar paragraph={{ rows: 2 }} />
        </Card>
        <Row gutter={[16, 16]}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Col key={i} xs={12} sm={6}>
              <Card bordered={false} className="shadow-sm">
                <Skeleton active paragraph={{ rows: 1 }} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  if (error || !photographer) {
    return (
      <div className="space-y-4">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/admin/photographers")}
        >
          Back to photographers
        </Button>
        <Text type="danger">{error || "Photographer not found"}</Text>
      </div>
    );
  }

  const storagePct =
    photographer.storageLimit > 0
      ? Math.min(
          100,
          (photographer.storageUsed / photographer.storageLimit) * 100,
        )
      : 0;

  const displayName = photographer.companyName || photographer.email;

  return (
    <div className="space-y-6">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/admin/photographers")}
        className="!px-0"
      >
        Back to photographers
      </Button>

      <Flex vertical gap={40}>
        <Card bordered={false} className="shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <Avatar
                size={64}
                src={photographer.companyLogo ?? undefined}
                icon={<CameraOutlined />}
                className={
                  photographer.companyLogo
                    ? "!bg-white"
                    : "!bg-primary/10 !text-primary"
                }
              />
              <div>
                <Space wrap align="center">
                  <Title level={3} className="!mb-0">
                    {displayName}
                  </Title>
                  <Tag color={photographer.isActive ? "success" : "error"}>
                    {photographer.isActive ? "Active" : "Inactive"}
                  </Tag>
                  {photographer.onboarded ? (
                    <Tag color="blue">Onboarded</Tag>
                  ) : (
                    <Tag>Not onboarded</Tag>
                  )}
                </Space>
                <div className="mt-1">
                  <Text type="secondary">{photographer.email}</Text>
                </div>
                <div className="mt-2">
                  <Space wrap size={[8, 4]}>
                    <Text type="secondary" className="text-xs">
                      Account ID:{" "}
                      <Text code className="text-xs">
                        {photographer.accountId}
                      </Text>
                    </Text>
                    {photographer.planName && (
                      <Tag>{photographer.planName}</Tag>
                    )}
                    {photographer.subscriptionStatus && (
                      <Tag
                        color={statusTagColor(photographer.subscriptionStatus)}
                      >
                        {photographer.subscriptionStatus}
                      </Tag>
                    )}
                  </Space>
                </div>
              </div>
            </div>

            <Space wrap className="sm:justify-end">
              {photographer.isActive ? (
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={() => setConfirmAction("deactivate")}
                >
                  Deactivate
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={() => setConfirmAction("activate")}
                >
                  Activate
                </Button>
              )}
              {!photographer.emailVerified && (
                <Button
                  icon={<CheckCircleOutlined />}
                  onClick={() => setConfirmAction("verify-email")}
                >
                  Verify email
                </Button>
              )}
              <Button
                icon={<MessageOutlined />}
                onClick={() => setComposeOpen(true)}
              >
                Send message
              </Button>
            </Space>
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic title="Clients" value={photographer.clientsCount} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic title="Galleries" value={photographer.galleriesCount} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic title="Logins" value={photographer.loginCount} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} className="shadow-sm">
              <Statistic
                title="Active sessions"
                value={photographer.activeSessions}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="shadow-sm"
            title="Account"
            size="small"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Email">
                <Space>
                  {photographer.email}
                  {photographer.emailVerified ? (
                    <Tag color="success" icon={<MailOutlined />}>
                      Verified
                    </Tag>
                  ) : (
                    <Tag color="warning">Unverified</Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Auth provider">
                <span className="capitalize">{photographer.authProvider}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {formatDateTime(photographer.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Onboarded at">
                {formatDateTime(photographer.onboardedAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="shadow-sm"
            title="Studio"
            size="small"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Company">
                {photographer.companyName || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Slug">
                {photographer.slug || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Country">
                {photographer.country || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {photographer.phone || "—"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="shadow-sm"
            title="Subscription"
            size="small"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Plan">
                {photographer.planName || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {photographer.subscriptionStatus ? (
                  <Tag color={statusTagColor(photographer.subscriptionStatus)}>
                    {photographer.subscriptionStatus}
                  </Tag>
                ) : (
                  "—"
                )}
              </Descriptions.Item>
              {photographer.paystackSubscriptionCode && (
                <Descriptions.Item label="Paystack code">
                  <Text code>{photographer.paystackSubscriptionCode}</Text>
                </Descriptions.Item>
              )}
              {photographer.smsSenderId && (
                <Descriptions.Item label="SMS sender">
                  <Space direction="vertical" size={0}>
                    <Text code>{photographer.smsSenderId}</Text>
                    {photographer.smsSenderStatus && (
                      <Tag
                        color={statusTagColor(photographer.smsSenderStatus)}
                        className="!mt-1"
                      >
                        {photographer.smsSenderStatus}
                      </Tag>
                    )}
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="shadow-sm"
            title="Usage & activity"
            size="small"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Storage">
                <div className="w-full max-w-xs">
                  <div className="mb-1 flex justify-between text-xs">
                    <span>
                      {photographer.storageLabel} /{" "}
                      {photographer.storageLimitLabel}
                    </span>
                    <span>{Math.round(storagePct)}%</span>
                  </div>
                  <Progress
                    percent={storagePct}
                    showInfo={false}
                    strokeColor={storagePct > 90 ? "#ef4444" : undefined}
                    size="small"
                  />
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Last login">
                {formatDateTime(photographer.lastLoginAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Last seen">
                {formatDateTime(photographer.lastSeenAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        </Row>

        {photographer.recentSessions?.length > 0 && (
          <Card
            bordered={false}
            className="shadow-sm"
            title="Recent sessions"
            size="small"
          >
            <Table<Session>
              rowKey="id"
              columns={sessionColumns}
              dataSource={photographer.recentSessions}
              pagination={false}
              size="small"
              scroll={{ x: "max-content" }}
            />
          </Card>
        )}
      </Flex>

      <ConfirmDialog
        open={confirmAction === "deactivate"}
        title="Deactivate account"
        description="This will revoke all active sessions and invalidate the user's token. They will not be able to log in until activated again."
        confirmLabel="Deactivate"
        destructive
        loading={actionLoading}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction === "activate"}
        title="Activate account"
        description="This will allow the photographer to log in again."
        confirmLabel="Activate"
        loading={actionLoading}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction === "verify-email"}
        title="Verify email"
        description={
          <>
            Mark <strong>{photographer.email}</strong> as verified? The
            photographer will no longer need to complete email verification.
          </>
        }
        confirmLabel="Verify email"
        loading={actionLoading}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />

      <ComposeDrawer
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        config={config}
        onSend={handleCommunicate}
        title={`Message ${photographer.email}`}
      />
    </div>
  );
}
