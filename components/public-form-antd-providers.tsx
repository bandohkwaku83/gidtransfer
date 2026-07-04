"use client";

import { ConfigProvider } from "antd";

const publicFormTheme = {
  token: {
    colorPrimary: "#2563eb",
    borderRadius: 12,
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    colorBorder: "#e4e4e7",
    colorTextPlaceholder: "#a1a1aa",
  },
  components: {
    Input: {
      paddingInline: 16,
      paddingBlock: 10,
      activeShadow: "none",
      hoverBorderColor: "#d4d4d8",
      activeBorderColor: "#a1a1aa",
    },
    Table: {
      headerBg: "rgb(250 250 250)",
      headerSplitColor: "transparent",
      rowHoverBg: "rgba(244, 244, 245, 0.8)",
      borderColor: "#e4e4e7",
      cellPaddingBlockMD: 12,
      cellPaddingInlineMD: 16,
    },
  },
} as const;

/** Ant Design theme for login, onboarding, and other public auth forms. */
export function PublicFormAntdProviders({ children }: { children: React.ReactNode }) {
  return <ConfigProvider theme={publicFormTheme}>{children}</ConfigProvider>;
}
