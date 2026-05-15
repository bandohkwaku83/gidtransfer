import { DashboardAntdProviders } from "@/components/app-providers";
import { AuthGate } from "@/components/photographer/auth-gate";
import { PhotographerShell } from "@/components/photographer/photographer-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAntdProviders>
      <AuthGate>
        <PhotographerShell>{children}</PhotographerShell>
      </AuthGate>
    </DashboardAntdProviders>
  );
}
