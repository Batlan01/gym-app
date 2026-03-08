"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

// A tényleges builder a /programs/[programId] útvonalon él
// Ez az oldal csak átirányít oda
export default function ProgramBuilderRedirect() {
  const params = useParams();
  const router = useRouter();
  const programId = params?.programId as string;

  useEffect(() => {
    if (programId) router.replace(`/programs/${programId}`);
  }, [programId, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Betöltés…</div>
    </div>
  );
}
