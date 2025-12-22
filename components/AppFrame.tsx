"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AppBackdrop } from "@/components/AppBackdrop";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isLogin = pathname === "/login";

  return (
    <div className="min-h-dvh">
      {/* Login oldalon NE tegyük rá a bg.png-t,
          ott a ProfileGate / GymBackdrop intézi a hátteret */}
      {!isLogin && <AppBackdrop />}

      {/* content mindig előrébb legyen */}
      <div className="relative z-0">{children}</div>
    </div>
  );
}
