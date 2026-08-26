"use client";

import { ConfigProvider } from "antd";

/** Ant Design theme scoped to the admin dashboard. */
export function AdminAntdProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#5e001e",
          borderRadius: 12,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          colorBorder: "#e2e8f0",
          colorTextPlaceholder: "#94a3b8",
        },
        components: {
          Button: {
            primaryShadow: "none",
            defaultShadow: "none",
            fontWeight: 500,
          },
          Input: {
            paddingInline: 14,
            paddingBlock: 10,
            activeShadow: "none",
          },
          Table: {
            headerBg: "#f8fafc",
            headerSplitColor: "transparent",
            rowHoverBg: "rgba(253, 242, 245, 0.5)",
            borderColor: "#e2e8f0",
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
