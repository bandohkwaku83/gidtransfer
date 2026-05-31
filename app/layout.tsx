import type { Metadata } from "next";
import { Libre_Franklin, Geist_Mono, Playfair_Display } from "next/font/google";
import { AppAntdProviders } from "@/components/app-providers";
import { AppBootstrap } from "@/components/app-bootstrap";
import { ToastProvider } from "@/components/toast-provider";
import "./globals.css";

const libreSans = Libre_Franklin({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000",
  ),
  title: "Gido Studio | Photographer workspace and client galleries",
  description:
    "Photographer workspace and client galleries for proofing, delivery, and branded client experiences (UI preview).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${libreSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
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
