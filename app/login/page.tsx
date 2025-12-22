"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { LS_ACTIVE_PROFILE } from "@/lib/profiles";
import { ProfileGate } from "@/components/ProfileGate";

export default function LoginPage() {
  const router = useRouter();
  const [activeProfileId] = useLocalStorageState<string | null>(LS_ACTIVE_PROFILE, null);

  React.useEffect(() => {
    if (activeProfileId) {
      router.replace("/workout");
      router.refresh();
    }
  }, [activeProfileId, router]);

  return (
    <ProfileGate>
      {/* Login oldalon nem kell semmi más – a gate az UI */}
      <div className="min-h-dvh" />
    </ProfileGate>
  );
}
