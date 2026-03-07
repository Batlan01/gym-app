import { BottomNav } from "@/components/BottomNav";
import { Tile } from "@/components/Tile";

const tiles = [
  { title: "Mai edzés",    subtitle: "Gyors indítás",   href: "/workout",   accent: "cyan"  },
  { title: "Programok",    subtitle: "Sablonok",         href: "/programs",  accent: "green" },
  { title: "Gyakorlatok",  subtitle: "Katalógus",        href: "/exercises", accent: "cyan"  },
  { title: "Statisztika",  subtitle: "Összegzés",        href: "/progress",  accent: "green" },
  { title: "Testsúly",     subtitle: "Log",              href: "/progress",  accent: "amber" },
  { title: "Beállítások",  subtitle: "App",              href: "/settings",  accent: "amber" },
] as const;

export default function Home() {
  return (
    <main className="mx-auto max-w-md px-4 pt-6 pb-28 animate-in">
      <header className="mb-6">
        <div className="label-xs mb-1">GYM WEBAPP</div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Főoldal
        </h1>
      </header>

      <section className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <Tile
            key={t.title}
            title={t.title}
            subtitle={t.subtitle}
            href={t.href}
            accent={t.accent}
          />
        ))}
      </section>

      <BottomNav />
    </main>
  );
}
