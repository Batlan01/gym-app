// lib/useInviteNotification.ts
// Hook – lekéri az aktuális user pending invite-jait Firestore-ból
// Ezek jelennek meg az appban meghívóként
"use client";
import * as React from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import type { Invite } from "@/lib/coachTypes";

export function useInviteNotification() {
  const [invites, setInvites] = React.useState<Invite[]>([]);

  React.useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (!user) { setInvites([]); return; }

      // Figyeljük a pending invite-okat ahol targetUid === user.uid
      const q = query(
        collection(db, "invites"),
        where("targetUid", "==", user.uid),
        where("status", "==", "pending")
      );

      const unsubSnap = onSnapshot(q, snap => {
        const now = new Date().toISOString();
        const active = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Invite))
          .filter(inv => inv.expiresAt > now);
        setInvites(active);
      });

      return () => unsubSnap();
    });

    return () => unsub();
  }, []);

  const acceptInvite = async (inviteId: string) => {
    const token = await auth.currentUser?.getIdToken();
    await fetch("/api/coach/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ inviteId }),
    });
  };

  const declineInvite = async (inviteId: string) => {
    await updateDoc(doc(db, "invites", inviteId), { status: "cancelled" });
  };

  return { invites, acceptInvite, declineInvite };
}
