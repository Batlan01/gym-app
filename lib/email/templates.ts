// lib/email/templates.ts
// Email HTML sablonok – inline CSS (email kliensek miatt)

export interface InviteEmailData {
  toEmail: string;
  coachName: string;
  teamName: string;
  inviteId: string;
  appUrl: string;
  expiresAt: string; // ISO
}

export function buildInviteEmailHtml(d: InviteEmailData): string {
  const acceptUrl = `${d.appUrl}/join?invite=${d.inviteId}`;
  const expiryDate = new Date(d.expiresAt).toLocaleDateString("hu-HU", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ARCX meghívó</title>
</head>
<body style="margin:0;padding:0;background:#080B0F;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080B0F;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#0F1318;border-radius:20px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

        <!-- Header sáv -->
        <tr>
          <td style="background:linear-gradient(135deg,#0e2a2e,#0a1f1a);padding:32px 40px 28px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
            <div style="display:inline-block;background:linear-gradient(135deg,#22d3ee,#4ade80);border-radius:12px;width:44px;height:44px;line-height:44px;text-align:center;font-size:20px;font-weight:900;color:#080B0F;margin-bottom:14px;">A</div>
            <div style="color:#F0F4F8;font-size:22px;font-weight:700;letter-spacing:-0.3px;">ARCX Premium</div>
            <div style="color:#22d3ee;font-size:11px;font-weight:600;letter-spacing:3px;margin-top:3px;">COACH PLATFORM</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="color:rgba(240,244,248,0.55);font-size:13px;margin:0 0 6px;">Meghívó érkezett</p>
            <h1 style="color:#F0F4F8;font-size:24px;font-weight:700;margin:0 0 20px;line-height:1.3;">
              Csatlakozz a <span style="color:#22d3ee;">${d.teamName}</span> csapathoz!
            </h1>
            <p style="color:rgba(240,244,248,0.65);font-size:15px;line-height:1.6;margin:0 0 28px;">
              <strong style="color:#F0F4F8;">${d.coachName}</strong> edző meghívott, hogy csatlakozz a csapatához az ARCX Premium platformon. Kövesd nyomon az edzéseidet, tekintsd meg a tervezett programokat, és tartsd a kapcsolatot az edződdel.
            </p>

            <!-- CTA gomb -->
            <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:28px;">
              <a href="${acceptUrl}"
                style="display:inline-block;background:linear-gradient(135deg,#22d3ee,#06b6d4);color:#080B0F;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.2px;">
                Meghívó elfogadása →
              </a>
            </td></tr></table>

            <!-- Info box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(34,211,238,0.06);border:1px solid rgba(34,211,238,0.15);border-radius:12px;">
              <tr><td style="padding:16px 20px;">
                <p style="color:rgba(240,244,248,0.5);font-size:12px;margin:0 0 8px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Részletek</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:rgba(240,244,248,0.45);font-size:13px;padding:3px 0;">Edző</td>
                    <td style="color:#F0F4F8;font-size:13px;font-weight:600;text-align:right;padding:3px 0;">${d.coachName}</td>
                  </tr>
                  <tr>
                    <td style="color:rgba(240,244,248,0.45);font-size:13px;padding:3px 0;">Csapat</td>
                    <td style="color:#F0F4F8;font-size:13px;font-weight:600;text-align:right;padding:3px 0;">${d.teamName}</td>
                  </tr>
                  <tr>
                    <td style="color:rgba(240,244,248,0.45);font-size:13px;padding:3px 0;">Lejár</td>
                    <td style="color:#fbbf24;font-size:13px;font-weight:600;text-align:right;padding:3px 0;">${expiryDate}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Link fallback -->
        <tr>
          <td style="padding:0 40px 20px;">
            <p style="color:rgba(240,244,248,0.35);font-size:12px;margin:0;line-height:1.6;">
              Ha a gomb nem működik, másold be ezt a linket a böngésződbe:<br/>
              <a href="${acceptUrl}" style="color:#22d3ee;word-break:break-all;">${acceptUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.06);padding:20px 40px;text-align:center;">
            <p style="color:rgba(240,244,248,0.25);font-size:11px;margin:0;line-height:1.6;">
              Ez az email az ARCX Premium rendszertől érkezett.<br/>
              Ha nem kérted ezt a meghívót, nyugodtan hagyd figyelmen kívül.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildInviteEmailText(d: InviteEmailData): string {
  const acceptUrl = `${d.appUrl}/join?invite=${d.inviteId}`;
  return [
    `ARCX Premium – Csapat meghívó`,
    ``,
    `${d.coachName} meghívott a "${d.teamName}" csapatba.`,
    ``,
    `Meghívó elfogadása: ${acceptUrl}`,
    ``,
    `Ez a meghívó ${new Date(d.expiresAt).toLocaleDateString("hu-HU")} napig érvényes.`,
  ].join("\n");
}
