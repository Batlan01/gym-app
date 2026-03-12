// lib/email/resend.ts
// Resend email kliens singleton
import { Resend } from "resend";

let _client: Resend | null = null;

export function getResend(): Resend {
  if (!_client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY environment variable is not set");
    _client = new Resend(key);
  }
  return _client;
}

// Az a domain/email, ahonnan küldjük
// Fejlesztésben: onboarding@resend.dev (Resend test address, minden fiókhoz ingyenesen működik)
// Élesben: noreply@arcxapp.com vagy hasonló (saját domain után)
export const FROM_EMAIL =
  process.env.EMAIL_FROM ?? "ARCX Coach <onboarding@resend.dev>";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://gym-app-sepia-beta.vercel.app";
