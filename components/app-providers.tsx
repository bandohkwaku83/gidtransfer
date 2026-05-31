"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";

/** Ant Design registry + theme for forms, tables, and inputs app-wide. */
export function AppAntdProviders({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#2563eb",
            borderRadius: 10,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
          },
          components: {
            Table: {
              headerBg: "rgb(250 250 250)",
              headerSplitColor: "transparent",
              rowHoverBg: "rgba(244, 244, 245, 0.8)",
              borderColor: "#e4e4e7",
              cellPaddingBlockMD: 12,
              cellPaddingInlineMD: 16,
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}

/** @deprecated Use {@link AppAntdProviders} */
export const DashboardAntdProviders = AppAntdProviders;
