import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { AppAntdProviders } from "@/components/app-providers";
import { AppBootstrap } from "@/components/app-bootstrap";
import { ToastProvider } from "@/components/toast-provider";
import { buildRootSiteMetadata } from "@/lib/marketing/site-seo";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = buildRootSiteMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontVariables} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppAntdProviders>
          <ToastProvider>
            <AppBootstrap>{children}</AppBootstrap>
          </ToastProvider>
        </AppAntdProviders>
      </body>
    </html>
  );
}
