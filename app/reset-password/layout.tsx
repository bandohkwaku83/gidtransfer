import { PublicFormAntdProviders } from "@/components/public-form-antd-providers";

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <PublicFormAntdProviders>{children}</PublicFormAntdProviders>;
}
