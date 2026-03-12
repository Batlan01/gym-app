// lib/coachTypes.ts
// â”€â”€â”€ Premium / Coach tĂ­pusok â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type PremiumRole = "coach" | "athlete";

export type PremiumUser = {
  uid: string;
  role: PremiumRole;
  plan: "premium";
  teamId?: string;       // ha coach: sajĂˇt csapat; ha athlete: amelyikhez tartozik
  createdAt: string;     // ISO
};

export type Team = {
  id: string;
  name: string;
  coachUid: string;
  coachName?: string;
  plan: "premium";
  createdAt: string;
};

export type TeamMemberStatus = "active" | "invited" | "removed";

export type TeamMember = {
  uid: string;
  displayName: string;
  email: string;
  group: string;         // pl. "A csoport"
  status: TeamMemberStatus;
  joinedAt: string;      // ISO
  addedBy: string;       // coachUid
};

export type InviteMethod = "email" | "code";
export type InviteStatus  = "pending" | "accepted" | "expired" | "cancelled";

export type Invite = {
  id: string;
  teamId: string;
  coachUid: string;
  method: InviteMethod;

  // email / in-app meghĂ­vĂł esetĂ©n
  email?: string;

  // in-app: meghĂ­vott user uid-ja (ha mĂˇr regisztrĂˇlt az appban)
  targetUid?: string;

  // meghĂ­vĂłkĂłd esetĂ©n
  inviteCode?: string;

  group?: string;        // csoport ahova meghĂ­vva
  status: InviteStatus;
  createdAt: string;     // ISO
  expiresAt: string;     // ISO â€“ alapbĂłl +7 nap
  acceptedBy?: string;   // uid, ha elfogadtĂˇk
  acceptedAt?: string;   // ISO
};
