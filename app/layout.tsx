import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppFrame } from "@/components/AppFrame";
import { PendingSyncRunner } from "@/components/PendingSyncRunner";

export const metadata: Metadata = {
  title: "Gym Webapp",
  description: "Gym tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GymApp",
  },
};

export const viewport: Viewport = {
  themeColor: "#080B0F",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-dvh text-white" style={{ backgroundColor: 'var(--bg-base)' }}>
        <AppFrame>
          {children}
          <PendingSyncRunner />
        </AppFrame>
      </body>
    </html>
  );
}
