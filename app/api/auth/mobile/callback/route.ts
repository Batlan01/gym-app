import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = '672508825758-kf189cfui5ehtt1b5p3d1v9lur9hu30v.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const FIREBASE_API_KEY = 'AIzaSyAAQQnPUv8oRRNPBp30bbJqfuBfLeRU6hk';
const APP_URL = 'https://gym-app-sepia-beta.vercel.app';

// GET /api/auth/mobile/callback?code=xxx&state=base64(deeplink)
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  if (!code || !state) return NextResponse.json({ error: 'missing params' }, { status: 400 });

  const mobileRedirect = Buffer.from(state, 'base64').toString('utf-8');
  const callbackUrl = `${APP_URL}/api/auth/mobile/callback`;

  // 1. code -> access_token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.json({ error: 'token exchange failed', detail: tokenData }, { status: 500 });
  }

  // 2. access_token -> Firebase idToken
  const firebaseRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestUri: 'http://localhost',
        postBody: `access_token=${tokenData.access_token}&providerId=google.com`,
        returnSecureToken: true,
        returnIdpCredential: true,
      }),
    }
  );
  const firebaseData = await firebaseRes.json();
  if (!firebaseData.idToken) {
    return NextResponse.json({ error: 'firebase auth failed', detail: firebaseData }, { status: 500 });
  }

  // 3. Deep link visszairanyitas a mobilra a tokenekkel
  const params = new URLSearchParams({
    idToken: firebaseData.idToken,
    uid: firebaseData.localId,
    email: firebaseData.email ?? '',
    displayName: firebaseData.displayName ?? '',
    photoURL: firebaseData.photoUrl ?? '',
  });

  return NextResponse.redirect(`${mobileRedirect}?${params.toString()}`);
}