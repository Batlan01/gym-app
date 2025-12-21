import { BottomNav } from "@/components/BottomNav";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-md px-4 pt-5 pb-28">
      <h1 className="text-2xl font-bold text-white">Beállítások</h1>
      <p className="mt-2 text-sm text-white/60">Később: export/import, units, stb.</p>
      <BottomNav />
    </main>
  );
}
