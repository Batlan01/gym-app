// lib/email/sendInvite.ts
// Meghívó email küldése Resend-en keresztül
import { getResend, FROM_EMAIL, APP_URL } from "@/lib/email/resend";
import { buildInviteEmailHtml, buildInviteEmailText } from "@/lib/email/templates";

export interface SendInviteParams {
  toEmail: string;
  coachName: string;
  teamName: string;
  inviteId: string;
  expiresAt: string;
}

export interface SendInviteResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export async function sendInviteEmail(params: SendInviteParams): Promise<SendInviteResult> {
  const data = { ...params, appUrl: APP_URL };

  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.toEmail,
      subject: `${params.coachName} meghívott az ARCX csapatba`,
      html: buildInviteEmailHtml(data),
      text: buildInviteEmailText(data),
    });

    if (result.error) {
      console.error("[sendInviteEmail] Resend error:", result.error);
      return { ok: false, error: result.error.message };
    }

    return { ok: true, messageId: result.data?.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown email error";
    console.error("[sendInviteEmail] Exception:", msg);
    return { ok: false, error: msg };
  }
}
