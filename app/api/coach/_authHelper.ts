// app/api/coach/_authHelper.ts
// Shared Firebase Admin auth helper for coach API routes
// Uses Firebase REST API to verify ID tokens (no Admin SDK needed on Vercel Edge)

export async function verifyIdToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const idToken = authHeader.slice(7);

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const user = data?.users?.[0];
    return user?.localId ?? null;
  } catch {
    return null;
  }
}

export function jsonError(msg: string, status = 400) {
  return Response.json({ error: msg }, { status });
}

export function nanoid(len = 20): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/** Generates a short human-readable invite code, e.g. "ARCX-4F2K" */
export function makeInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ARCX-${code}`;
}
