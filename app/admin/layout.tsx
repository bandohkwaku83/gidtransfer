import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AuthProvider } from "@/lib/admin/use-admin-auth";
import { AdminToastProvider } from "@/lib/admin/use-admin-toast";
import "./admin.css";

export const metadata: Metadata = {
  title: "GidTransfer Admin",
  description: "Admin dashboard for GidTransfer",
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="admin-app min-h-full bg-[#f4f6f9] font-sans text-slate-900 antialiased">
      <AntdRegistry>
        <AuthProvider>
          <AdminToastProvider>{children}</AdminToastProvider>
        </AuthProvider>
      </AntdRegistry>
    </div>
  );
}
