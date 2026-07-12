import { AppShell } from "@/components/admin/layout/AppShell";

export default function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
