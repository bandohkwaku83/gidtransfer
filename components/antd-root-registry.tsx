"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";

/** SSR style registry — keep at root; does not load form/table components. */
export function AntdRootRegistry({ children }: { children: React.ReactNode }) {
  return <AntdRegistry>{children}</AntdRegistry>;
}
