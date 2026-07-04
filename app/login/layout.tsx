import { PublicFormAntdProviders } from "@/components/public-form-antd-providers";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <PublicFormAntdProviders>{children}</PublicFormAntdProviders>;
}
