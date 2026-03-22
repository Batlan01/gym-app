import { verifyIdTokenFull, jsonError } from "@/app/api/coach/_authHelper";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function ah(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}
function fromFs(fields: Record<string,unknown>): Record<string,unknown> {
  const out: Record<string,unknown> = {};
  for (const [k,v] of Object.entries(fields)) {
    const fv = v as Record<string,unknown>;
    if ("stringValue"  in fv) out[k] = fv.stringValue;
    else if ("integerValue" in fv) out[k] = Number(fv.integerValue);
    else if ("doubleValue" in fv) out[k] = Number(fv.doubleValue);
    else if ("booleanValue" in fv) out[k] = fv.booleanValue;
    else if ("nullValue"    in fv) out[k] = null;
    else if ("timestampValue" in fv) out[k] = fv.timestampValue;
    else if ("arrayValue"   in fv) {
      const vals = ((fv.arrayValue as Record<string,unknown>)?.values as unknown[]) ?? [];
      out[k] = vals.map((x: unknown) => {
        const xf = x as Record<string,unknown>;
        if ("mapValue"    in xf) return fromFs((xf.mapValue as Record<string,unknown>).fields as Record<string,unknown>);
        if ("stringValue" in xf) return xf.stringValue;
        if ("integerValue" in xf) return Number(xf.integerValue);
        if ("doubleValue" in xf) return Number(xf.doubleValue);
        if ("booleanValue" in xf) return xf.booleanValue;
        if ("nullValue" in xf) return null;
        if ("timestampValue" in xf) return xf.timestampValue;
        return null;
      });
    } else if ("mapValue" in fv) out[k] = fromFs((fv.mapValue as Record<string,unknown>).fields as Record<string,unknown>);
  }
  return out;
}

// GET /api/athlete/dashboard
// Visszaadja: streak, workoutsThisMonth, volumeThisMonth, weekWorkouts (7 nap)
export async function GET(req: Request) {
  const auth = await verifyIdTokenFull(req.headers.get("Authorization"));
  if (!auth) return jsonError("Unauthorized", 401);
  const { uid, token } = auth;

  // users/{uid}/workouts kollekcio
  const res = await fetch(`${FS}/users/${uid}/workouts`, { headers: ah(token) });
  const data = res.ok ? await res.json() : {};
  const docs = data.documents ?? [];

  const sessions = docs.map((d: Record<string,unknown>) => ({
    id: (d.name as string).split("/").pop()!,
    ...fromFs((d.fields ?? {}) as Record<string,unknown>),
  }));

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStr = now.toISOString().slice(0, 7);

  // Streak: hány egymást követő nap van edzés (visszafelé)
  const sessionDates = new Set(
    sessions
      .map((s: Record<string,unknown>) => {
        // Web app: startedAt is ISO string, API-created: completedAt is timestamp
        const startedAt = s.startedAt as string | undefined;
        const ts = s.completedAt ?? s.createdAt;
        if (startedAt && typeof startedAt === 'string') return startedAt.slice(0, 10);
        if (!ts) return null;
        return new Date(Number(ts)).toISOString().slice(0, 10);
      })
      .filter(Boolean)
  );

  let streak = 0;
  const cursor = new Date(now);
  while (true) {
    const d = cursor.toISOString().slice(0, 10);
    if (sessionDates.has(d)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (d === todayStr) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  // Edzések száma ebben a hónapban
  const workoutsThisMonth = sessions.filter((s: Record<string,unknown>) => {
    const startedAt = s.startedAt as string | undefined;
    const ts = s.completedAt ?? s.createdAt;
    const dateStr = startedAt && typeof startedAt === 'string' ? startedAt : (ts ? new Date(Number(ts)).toISOString() : '');
    return dateStr.startsWith(monthStr);
  }).length;

  // Volume ebben a hónapban (kg)
  const volumeThisMonth = sessions
    .filter((s: Record<string,unknown>) => {
      const startedAt = s.startedAt as string | undefined;
      const ts = s.completedAt ?? s.createdAt;
      const dateStr = startedAt && typeof startedAt === 'string' ? startedAt : (ts ? new Date(Number(ts)).toISOString() : '');
      return dateStr.startsWith(monthStr);
    })
    .reduce((sum: number, s: Record<string,unknown>) => {
      let vol = Number(s.totalVolume) || 0;
      // Fallback: calculate from exercises if totalVolume not stored
      if (!vol && Array.isArray(s.exercises)) {
        for (const ex of s.exercises as any[]) {
          for (const st of (ex?.sets ?? []) as any[]) {
            vol += (Number(st?.weight) || 0) * (Number(st?.reps) || 0);
          }
        }
      }
      return sum + vol;
    }, 0);

  // Heti edzések: utolsó 7 nap
  const weekWorkouts: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const count = sessions.filter((s: Record<string,unknown>) => {
      const startedAt = s.startedAt as string | undefined;
      const ts = s.completedAt ?? s.createdAt;
      const sDate = startedAt && typeof startedAt === 'string' ? startedAt.slice(0,10) : (ts ? new Date(Number(ts)).toISOString().slice(0, 10) : '');
      return sDate === dateStr;
    }).length;
    weekWorkouts.push({ date: dateStr, count });
  }

  // Mai schedule (ha van coach)
  const premRes = await fetch(`${FS}/premiumUsers/${uid}`, { headers: ah(token) });
  let todaySchedule = null;
  if (premRes.ok) {
    const premData = await premRes.json();
    const coachUid = premData?.fields?.coachUid?.stringValue as string | undefined;
    if (coachUid) {
      const schedRes = await fetch(`${FS}/schedules/${coachUid}/entries/${todayStr}`, { headers: ah(token) });
      if (schedRes.ok) {
        const schedData = await schedRes.json();
        const entry = fromFs((schedData.fields ?? {}) as Record<string,unknown>);
        const assignments = (entry.assignments as Record<string,unknown>[]) ?? [];
        const mine = assignments.find(a => a.memberUid === uid);
        if (mine) todaySchedule = mine;
      }
    }
  }

  return Response.json({ streak, workoutsThisMonth, volumeThisMonth: Math.round(volumeThisMonth), weekWorkouts, todaySchedule });
}