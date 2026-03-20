import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppFrame } from "@/components/AppFrame";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PendingSyncRunner } from "@/components/PendingSyncRunner";
import { PushSWRegistrar } from "@/components/PushSWRegistrar";
import { InviteBanner } from "@/components/InviteBanner";

export const metadata: Metadata = {
  title: "ARCX — Train Smarter",
  description: "ARCX — Az okos edzésnapló. Programok, statisztikák, XP rendszer.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ARCX",
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
      <body className="min-h-dvh" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            function hexToAccent(h) {
              var r=parseInt(h.slice(1,3),16), g=parseInt(h.slice(3,5),16), b=parseInt(h.slice(5,7),16);
              var d=document.documentElement;
              d.style.setProperty('--accent-primary',h);
              d.style.setProperty('--accent-primary-dim','rgba('+r+','+g+','+b+',0.12)');
              d.style.setProperty('--accent-primary-border','rgba('+r+','+g+','+b+',0.25)');
              d.style.setProperty('--accent-primary-ring','rgba('+r+','+g+','+b+',0.35)');
              d.style.setProperty('--accent-primary-solid','rgba('+r+','+g+','+b+',0.90)');
            }
            var presets = {
              cyan:'#22d3ee',purple:'#a78bfa',orange:'#fb923c',green:'#4ade80',
              rose:'#fb7185',blue:'#60a5fa',amber:'#fbbf24',indigo:'#818cf8',
              emerald:'#34d399',red:'#f87171'
            };
            var t = localStorage.getItem('gym.theme');
            if (t === 'custom') {
              var ch = localStorage.getItem('gym.customHex');
              if (ch) hexToAccent(ch);
            } else if (t && presets[t]) {
              hexToAccent(presets[t]);
            }
            var m = localStorage.getItem('gym.colorMode') || 'dark';
            var resolved = m;
            if (m === 'system') resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-mode', resolved);
            if (resolved === 'dark') document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
          } catch(e) {}
        `}} />
        <PushSWRegistrar />
        <InviteBanner />
        <ThemeProvider>
        <AppFrame>
          {children}
          <PendingSyncRunner />
        </AppFrame>
        </ThemeProvider>
      </body>
    </html>
  );
}
