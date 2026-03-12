// app/api/coach/invite/search-user/route.ts
// GET – keresi a usert email alapján a Firestore /users kollekcióban
// (Firebase Auth REST API csak email/password usereknél műkdig, Google OAuth-nál nem)
// Query: ?email=...
import { NextRequest } from "next/server";
import { verifyIdToken, jsonError } from "@/app/api/coach/_authHelper";

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;

export async function GET(req: NextRequest) {
  const uid = await verifyIdToken(req.headers.get("authorization"));
  if (!uid) return jsonError("Unauthorized", 401);

  const email = (req.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError("Valid email required");
  }

  try {
    // Firestore REST API – query: users collection where email == ?
    const res = await fetch(`${FIRESTORE_BASE}:runQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "users" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "email" },
              op: "EQUAL",
              value: { stringValue: email },
            },
          },
          limit: 1,
        },
      }),
    });

    if (!res.ok) return Response.json({ found: false });

    const results = await res.json();
    const doc = results?.[0]?.document;
    if (!doc) return Response.json({ found: false });

    const fields = doc.fields ?? {};
    const foundUid = fields.uid?.stringValue;
    if (!foundUid || foundUid === uid) return Response.json({ found: false });

    return Response.json({
      found: true,
      uid: foundUid,
      displayName: fields.displayName?.stringValue ?? null,
      email: fields.email?.stringValue ?? email,
      photoURL: fields.photoURL?.stringValue ?? null,
    });
  } catch (err) {
    console.error("[search-user]", err);
    return jsonError("Lookup failed", 500);
  }
}
