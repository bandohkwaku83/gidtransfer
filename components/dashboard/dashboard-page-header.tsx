import { cn } from "@/lib/utils";
import { DashboardPageHeaderArt } from "@/components/dashboard/dashboard-page-header-art";

type DashboardPageHeaderProps = {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  hideArt?: boolean;
};

export function DashboardPageHeader({
  children,
  className,
  innerClassName,
  hideArt = true,
}: DashboardPageHeaderProps) {
  return (
    <section className={cn("dashboard-page-header", !hideArt && "dashboard-page-header--with-art", className)}>
      {!hideArt ? <div className="dashboard-page-header-glow" aria-hidden /> : null}
      {!hideArt ? <DashboardPageHeaderArt /> : null}
      <div className={cn("dashboard-page-header-inner", innerClassName)}>{children}</div>
    </section>
  );
}

export function dashboardPageHeaderChipClassName(className?: string) {
  return cn("dashboard-page-header-chip", className);
}

export function dashboardPageHeaderStatClassName(className?: string) {
  return cn("dashboard-page-header-stat", className);
}

export function dashboardPageHeaderCtaClassName(className?: string) {
  return cn("dashboard-page-header-cta", className);
}

export function dashboardPageHeaderCtaSecondaryClassName(className?: string) {
  return cn("dashboard-page-header-cta-secondary", className);
}

export function dashboardPageHeaderPanelClassName(className?: string) {
  return cn("dashboard-page-header-panel", className);
}

export function dashboardPageHeaderTitleClassName(className?: string) {
  return cn("dashboard-page-header-title", className);
}

export function dashboardPageHeaderDescriptionClassName(className?: string) {
  return cn("dashboard-page-header-description", className);
}
