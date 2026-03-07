"use client";

import { useParams, useRouter } from "next/navigation";

export default function ProgramBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params?.programId as string;

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl font-bold mb-4">Program Builder</h1>
      <p className="text-white/60">Program ID: {programId}</p>
    </div>
  );
}