import type { Metadata } from "next";
import "./globals.css";
import { BaynerProvider } from "@/lib/store";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "باينر | مساعد التاجرة الذكي لمشاريع الكيك والحلويات",
  description:
    "نظام تشغيل متكامل لمشاريع الكيك والحلويات المنزلية: حاسبة التكلفة والهدر، استوديو المنيو، تقويم الطلبات وفواتير العربون، والرد الآلي للواتساب.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 font-sans antialiased">
        <BaynerProvider>
          <AppShell>{children}</AppShell>
        </BaynerProvider>
      </body>
    </html>
  );
}
