import Link from "next/link";

export function Tile({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href?: string;
}) {
  const inner = (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-sm backdrop-blur hover:bg-white/10 active:scale-[0.99] transition">
      <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/15 transition" />
      <div className="text-base font-semibold text-white">{title}</div>
      {subtitle ? (
        <div className="mt-1 text-sm text-white/70">{subtitle}</div>
      ) : (
        <div className="mt-1 text-sm text-white/50">—</div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }

  return <button type="button" className="block w-full text-left">{inner}</button>;
}
