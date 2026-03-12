// lib/useInviteNotification.ts
"use client";
import * as React from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import type { Invite } from "@/lib/coachTypes";

export function useInviteNotification() {
  const [invites, setInvites] = React.useState<Invite[]>([]);
  // Lokálisan kezelt elfogadott/visszautasított id-k (azonnali eltüntetés)
  const [resolved, setResolved] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (!user) { setInvites([]); return; }

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
    // Azonnal eltüntetjük lokálisan
    setResolved(prev => new Set([...prev, inviteId]));
    const token = await auth.currentUser?.getIdToken();
    await fetch("/api/coach/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ inviteId }),
    });
  };

  const declineInvite = async (inviteId: string) => {
    // Azonnal eltüntetjük lokálisan
    setResolved(prev => new Set([...prev, inviteId]));
    await updateDoc(doc(db, "invites", inviteId), { status: "cancelled" });
  };

  const visibleInvites = invites.filter(i => !resolved.has(i.id));

  return { invites: visibleInvites, acceptInvite, declineInvite };
}
