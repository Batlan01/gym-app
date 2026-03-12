// lib/coachTypes.ts
// ─── Premium / Coach típusok ─────────────────────────────────────────────────

export type PremiumRole = "coach" | "athlete";

export type PremiumUser = {
  uid: string;
  role: PremiumRole;
  plan: "premium";
  teamId?: string;       // ha coach: saját csapat; ha athlete: amelyikhez tartozik
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

  // email / in-app meghívó esetén
  email?: string;

  // in-app: meghívott user uid-ja (ha már regisztrált az appban)
  targetUid?: string;

  // meghívókód esetén
  inviteCode?: string;

  group?: string;        // csoport ahova meghívva
  status: InviteStatus;
  createdAt: string;     // ISO
  expiresAt: string;     // ISO – alapból +7 nap
  acceptedBy?: string;   // uid, ha elfogadták
  acceptedAt?: string;   // ISO
};
