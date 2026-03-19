import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = '672508825758-kf189cfui5ehtt1b5p3d1v9lur9hu30v.apps.googleusercontent.com';
const APP_URL = 'https://gym-app-sepia-beta.vercel.app';

// GET /api/auth/mobile?redirect=arcx%3A%2F%2Fauth
export async function GET(req: NextRequest) {
  const redirectUri = req.nextUrl.searchParams.get('redirect');
  if (!redirectUri) return NextResponse.json({ error: 'missing redirect' }, { status: 400 });

  const callbackUrl = `${APP_URL}/api/auth/mobile/callback`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    state: Buffer.from(redirectUri).toString('base64'),
    access_type: 'offline',
    prompt: 'select_account',
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}