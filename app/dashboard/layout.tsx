import { PlanUpgradeModal } from "@/components/billing/plan-upgrade-modal";
import { DashboardUiThemeProvider } from "@/components/dashboard-ui-theme";
import { DashboardAntdProviders } from "@/components/dashboard-antd-providers";
import { AuthGate } from "@/components/photographer/auth-gate";
import { PhotographerShell } from "@/components/photographer/photographer-shell";
import { DashboardTourProvider } from "@/components/tour/dashboard-tour";
import { PlanEntitlementsProvider } from "@/lib/use-plan-entitlements";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <PlanEntitlementsProvider>
        <DashboardUiThemeProvider>
          <DashboardAntdProviders>
            <DashboardTourProvider>
              <PhotographerShell>{children}</PhotographerShell>
              <PlanUpgradeModal />
            </DashboardTourProvider>
          </DashboardAntdProviders>
        </DashboardUiThemeProvider>
      </PlanEntitlementsProvider>
    </AuthGate>
  );
}
