import type { Metadata } from "next";
import "./globals.css";
import { AppFrame } from "@/components/AppFrame";
import { PendingSyncRunner } from "@/components/PendingSyncRunner";

export const metadata: Metadata = {
  title: "Gym Webapp",
  description: "Gym tracker",
  manifest: "/manifest.json",
  themeColor: "#0a0a0a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GymApp",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-dvh bg-black text-white">
        <AppFrame>
          {children}
          <PendingSyncRunner />
        </AppFrame>
      </body>
    </html>
  );
}