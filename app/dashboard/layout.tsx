import { DashboardUiThemeProvider } from "@/components/dashboard-ui-theme";
import { AuthGate } from "@/components/photographer/auth-gate";
import { PhotographerShell } from "@/components/photographer/photographer-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <DashboardUiThemeProvider>
        <PhotographerShell>{children}</PhotographerShell>
      </DashboardUiThemeProvider>
    </AuthGate>
  );
}
