import { BottomNav } from "@/components/BottomNav";
import { Tile } from "@/components/Tile";

const tiles = [
  { title: "Mai edzés", subtitle: "Gyors indítás", href: "/workout" },
  { title: "Programok", subtitle: "Sablonok", href: "/programs" }, // ha még nincs oldal, hagyd ki
  { title: "Gyakorlatok", subtitle: "Katalógus", href: "/exercises" }, // <-- EZ KELL
  { title: "Statisztika", subtitle: "Összegzés", href: "/progress" },
  { title: "Testsúly", subtitle: "Log", href: "/progress" },
  { title: "Beállítások", subtitle: "App", href: "/settings" },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-md px-4 pt-5 pb-28">
      <header className="mb-4">
        <div className="text-xs tracking-widest text-zinc-500 dark:text-white/50">
          GYM WEBAPP
        </div>
        <h1 className="mt-1 text-2xl font-bold">Főoldal</h1>
      </header>

      <section className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <Tile key={t.title} title={t.title} subtitle={t.subtitle} href={t.href} />
        ))}
      </section>

      <BottomNav />
    </main>
  );
}
