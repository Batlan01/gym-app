import type { Metadata } from "next";
import "./globals.css";
import { AppFrame } from "@/components/AppFrame";
import { PendingSyncRunner } from "@/components/PendingSyncRunner";

export const metadata: Metadata = {
  title: "Gym Webapp",
  description: "Gym tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body className="min-h-dvh bg-black text-white">
        <AppFrame>
          {children}
          <PendingSyncRunner />
        </AppFrame>
      </body>
    </html>
  );
}
