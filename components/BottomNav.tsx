"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const items = [
  { label: "Home", href: "/" },
  { label: "Edzés", href: "/workout" },
  { label: "Progress", href: "/progress" },
  { label: "Beáll.", href: "/settings" },
];

export function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md px-3">
        <div className="mb-3 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-2 p-2">
            <div className="flex flex-1 items-center justify-between gap-1">
              {items.map((it) => {
                const active = path === it.href;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={[
                      "flex-1 rounded-xl px-3 py-2 text-center text-sm transition",
                      active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
                    ].join(" ")}
                  >
                    {it.label}
                  </Link>
                );
              })}
            </div>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
