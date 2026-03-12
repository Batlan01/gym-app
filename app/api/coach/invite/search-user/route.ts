// app/api/coach/invite/search-user/route.ts
// GET – keresi a usert email alapján Firebase Auth REST API-val
// Query: ?email=...
import { NextRequest } from "next/server";
import { verifyIdToken, jsonError } from "@/app/api/coach/_authHelper";

export async function GET(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return jsonError("Unauthorized", 401);

  const email = (req.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError("Valid email required");
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return jsonError("Server config error", 500);

  try {
    // Firebase Auth REST: lookup user by email
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: [email] }),
      }
    );

    if (!res.ok) return Response.json({ found: false });

    const data = await res.json();
    const user = data?.users?.[0];

    if (!user) return Response.json({ found: false });

    return Response.json({
      found: true,
      uid: user.localId,
      displayName: user.displayName ?? null,
      email: user.email,
      photoURL: user.photoUrl ?? null,
    });
  } catch (err) {
    console.error("[search-user]", err);
    return jsonError("Lookup failed", 500);
  }
}
