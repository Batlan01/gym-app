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
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-dvh text-white" style={{ backgroundColor: 'var(--bg-base)' }}>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('gym.theme');
            var themes = {
              purple: {'--accent-primary':'#a78bfa','--accent-primary-dim':'rgba(167,139,250,0.15)','--accent-primary-border':'rgba(167,139,250,0.3)'},
              orange: {'--accent-primary':'#fb923c','--accent-primary-dim':'rgba(251,146,60,0.15)','--accent-primary-border':'rgba(251,146,60,0.3)'},
              green:  {'--accent-primary':'#4ade80','--accent-primary-dim':'rgba(74,222,128,0.15)','--accent-primary-border':'rgba(74,222,128,0.3)'},
              rose:   {'--accent-primary':'#fb7185','--accent-primary-dim':'rgba(251,113,133,0.15)','--accent-primary-border':'rgba(251,113,133,0.3)'},
            };
            if (t && themes[t]) {
              var r = document.documentElement;
              Object.entries(themes[t]).forEach(function(e){ r.style.setProperty(e[0], e[1]); });
            }
          } catch(e) {}
        `}} />
        <AppFrame>
          {children}
          <PendingSyncRunner />
        </AppFrame>
      </body>
    </html>
  );
}
