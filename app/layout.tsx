import "./globals.css";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata = {
  title: "Gym Webapp",
  description: "Minimal mobile-first shell",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hu" suppressHydrationWarning>
      <body className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-[#07070A] dark:text-zinc-100">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
