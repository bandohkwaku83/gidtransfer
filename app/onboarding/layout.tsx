import { PublicFormAntdProviders } from "@/components/public-form-antd-providers";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <PublicFormAntdProviders>{children}</PublicFormAntdProviders>;
}
