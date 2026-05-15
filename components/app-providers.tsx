"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";

/**
 * AntD providers (registry + theme).
 *
 * Mounted only inside the dashboard layout so public routes (`/g/[token]`,
 * `/share/[code]`, `/login`, `/`) do not ship AntD in their JS bundles.
 */
export function DashboardAntdProviders({ children }: { children: React.ReactNode }) {
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
