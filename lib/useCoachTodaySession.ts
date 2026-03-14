// lib/useCoachTodaySession.ts
import * as React from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export interface CoachTodaySession {
  sessionName: string;
  programName: string;
  exercises: string[];
  slotId: string;
  fromCoach: true;
}

async function getToken(): Promise<string | null> {
  try {
    const auth = getAuth();
    if (auth.currentUser) return auth.currentUser.getIdToken();
    return new Promise(res => {
      const u = onAuthStateChanged(auth, user => {
        u();
        if (user) user.getIdToken().then(res).catch(() => res(null));
        else res(null);
      });
    });
  } catch { return null; }
}

export function useCoachTodaySessions(): CoachTodaySession[] {
  const [sessions, setSessions] = React.useState<CoachTodaySession[]>([]);

  React.useEffect(() => {
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
    const month = dateKey.slice(0, 7);

    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await fetch(`/api/athlete/schedule?month=${month}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const todayEntry = (data.entries ?? []).find(
          (e: { date: string }) => e.date === dateKey
        );
        if (!todayEntry?.assignments?.length) return;

        const result: CoachTodaySession[] = todayEntry.assignments.map(
          (a: { programName: string; sessionName: string; exercises?: string[] }) => ({
            sessionName: a.sessionName,
            programName: a.programName,
            exercises: Array.isArray(a.exercises) ? a.exercises : [],
            slotId: "main",
            fromCoach: true as const,
          })
        );
        setSessions(result);
      } catch(e) { console.error("useCoachTodaySessions:", e); }
    })();
  }, []);

  return sessions;
}
