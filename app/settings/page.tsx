"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { SyncStatusCard } from "@/components/SyncStatusCard";
import { MigrateLocalWorkoutsCard } from "@/components/MigrateLocalWorkoutsCard";
import { SignOutCard } from "@/components/SignOutCard";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, linkWithPopup, GoogleAuthProvider, unlink, type User } from "firebase/auth";
import { useTranslation } from "@/lib/i18n";
import {
  LS_NOTIF_SETTINGS,
  DEFAULT_NOTIF_SETTINGS,
  type NotifSettings,
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationsSupported,
  scheduleNextDailyReminder,
  cancelDailyReminder,
  showLocalNotification,
} from "@/lib/notifications";
import { getFCMToken } from "@/lib/fcm";

// Toggle switch component
function Toggle({ value, onChange, disabled }: {
  value: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      className="relative shrink-0 rounded-full transition-all duration-300 pressable"
      style={{
        width: 48, height: 28,
        background: value ? "var(--accent-primary)" : "rgba(255,255,255,0.1)",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <div className="absolute top-1 rounded-full transition-all duration-300"
        style={{
          width: 20, height: 20,
          background: "#fff",
          left: value ? 24 : 4,
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }} />
    </button>
  );
}

// Section card wrapper
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
      <div className="px-4 pt-4 pb-2">
        <div className="label-xs" style={{ color: "var(--text-muted)" }}>{title}</div>
      </div>
      <div className="px-4 pb-4 space-y-3">{children}</div>
    </div>
  );
}

// Row item
function SettingRow({ icon, title, subtitle, right, onPress }: {
  icon: string; title: string; subtitle?: string;
  right?: React.ReactNode; onPress?: () => void;
}) {
  return (
    <button
      onClick={onPress}
      className={`w-full flex items-center gap-3 py-1 ${onPress ? "pressable" : ""}`}
      style={{ cursor: onPress ? "pointer" : "default" }}
    >
      <div className="h-9 w-9 shrink-0 rounded-2xl flex items-center justify-center text-base"
        style={{ background: "var(--bg-card)" }}>
        {icon}
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</div>
        {subtitle && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</div>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </button>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [notifSettings, setNotifSettings] = useLocalStorageState<NotifSettings>(
    LS_NOTIF_SETTINGS, DEFAULT_NOTIF_SETTINGS
  );
  const [permission, setPermission] = React.useState<NotificationPermission>("default");
  const [supported, setSupported] = React.useState(false);
  const [testSent, setTestSent] = React.useState(false);
  const [fbUser, setFbUser] = React.useState<User | null>(null);
  const [linkBusy, setLinkBusy] = React.useState(false);
  const [linkMsg, setLinkMsg] = React.useState<{text:string;ok:boolean}|null>(null);

  React.useEffect(() => {
    setSupported(isNotificationsSupported());
    setPermission(getNotificationPermission());
    const unsub = onAuthStateChanged(auth, u => setFbUser(u));
    return () => unsub();
  }, []);

  // Notification scheduling sync
  React.useEffect(() => {
    if (notifSettings.enabled && permission === "granted") {
      scheduleNextDailyReminder(notifSettings);
    } else {
      cancelDailyReminder();
    }
    return () => cancelDailyReminder();
  }, [notifSettings, permission]);

  async function handleEnableNotifications(enable: boolean) {
    if (enable && permission !== "granted") {
      const perm = await requestNotificationPermission();
      setPermission(perm);
      if (perm !== "granted") {
        alert(t.settings.notif_blocked_alert);
        return;
      }
    }
    setNotifSettings(s => ({ ...s, enabled: enable }));

    // FCM token regisztráció / törlés
    if (enable) {
      try {
        const fcmToken = await getFCMToken();
        if (fcmToken && auth.currentUser) {
          const idToken = await auth.currentUser.getIdToken();
          await fetch("/api/push/register", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ fcmToken }),
          });
        }
      } catch (e) { console.warn("[FCM] Token regisztráció sikertelen:", e); }
    } else {
      try {
        if (auth.currentUser) {
          const idToken = await auth.currentUser.getIdToken();
          await fetch("/api/push/register", {
            method: "DELETE",
            headers: { Authorization: `Bearer ${idToken}` },
          });
        }
      } catch {}
    }
  }

  async function handleGoogleLink() {
    if (!fbUser) return;
    setLinkBusy(true); setLinkMsg(null);
    try {
      await linkWithPopup(fbUser, new GoogleAuthProvider());
      setLinkMsg({ text: "✓ Google sikeresen összekapcsolva! Mostantól Google-lel is beléphetsz.", ok: true });
    } catch (e: any) {
      if (e?.code === "auth/credential-already-in-use") {
        setLinkMsg({ text: "Ez a Google fiók már egy másik accounthoz van rendelve.", ok: false });
      } else if (e?.code === "auth/provider-already-linked") {
        setLinkMsg({ text: "✓ Google már össze van kapcsolva ezzel a fiókkal.", ok: true });
      } else if (e?.code === "auth/popup-closed-by-user") {
        // user bezárta, nem hiba
      } else {
        setLinkMsg({ text: e?.message ?? "Hiba történt.", ok: false });
      }
    } finally { setLinkBusy(false); }
  }

  async function handleGoogleUnlink() {
    if (!fbUser) return;
    setLinkBusy(true); setLinkMsg(null);
    try {
      await unlink(fbUser, "google.com");
      setLinkMsg({ text: "Google leválasztva. Email/jelszóval továbbra is beléphetsz.", ok: true });
    } catch (e: any) {
      setLinkMsg({ text: e?.message ?? "Hiba.", ok: false });
    } finally { setLinkBusy(false); }
  }

  const isGoogleLinked = fbUser?.providerData?.some(p => p.providerId === "google.com") ?? false;

  async function handleTestNotification() {
    if (permission !== "granted") return;
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
    await showLocalNotification(
      "ARCX — Teszt értesítés 🔔",
      "Az értesítések működnek! Holnap emlékeztetünk az edzésre.",
      "/workout"
    );
  }

  const permBadge = permission === "granted"
    ? { label: "Engedélyezve", color: "#4ade80" }
    : permission === "denied"
    ? { label: "Blokkolva", color: "#f87171" }
    : { label: "Nincs beállítva", color: "#fbbf24" };

  return (
    <main className="mx-auto max-w-md px-4 pt-8 pb-28 animate-in">
      <header className="mb-6">
        <div className="label-xs mb-1">ARCX</div>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{t.settings.title}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{t.settings.subtitle}</p>
      </header>

      <div className="space-y-4">

        {/* ÉRTESÍTÉSEK */}
        <Section title={t.settings.notif_section}>
          {!supported && (
            <div className="rounded-2xl p-3 text-xs"
              style={{ background: "rgba(251,191,36,0.1)", color: "#fde68a", border: "1px solid rgba(251,191,36,0.2)" }}>
              A böngésződ nem támogatja a push értesítéseket.
            </div>
          )}

          {supported && (
            <>
              {/* Főkapcsoló */}
              <SettingRow
                icon="🔔"
                title={t.settings.notif_enable}
                subtitle={`Állapot: ${permBadge.label}`}
                right={
                  <Toggle
                    value={notifSettings.enabled && permission === "granted"}
                    onChange={handleEnableNotifications}
                  />
                }
              />

              {/* Napi emlékeztető */}
              <SettingRow
                icon="⏰"
                title={t.settings.notif_daily}
                subtitle={t.settings.notif_daily_sub}
                right={
                  <Toggle
                    value={notifSettings.dailyReminderEnabled}
                    onChange={v => setNotifSettings(s => ({ ...s, dailyReminderEnabled: v }))}
                    disabled={!notifSettings.enabled}
                  />
                }
              />

              {/* Időpont beállítás */}
              {notifSettings.enabled && notifSettings.dailyReminderEnabled && (
                <div className="flex items-center gap-3 pl-12">
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Értesítés időpontja:</div>
                  <input
                    type="time"
                    value={notifSettings.dailyReminderTime}
                    onChange={e => setNotifSettings(s => ({ ...s, dailyReminderTime: e.target.value }))}
                    className="rounded-xl px-3 py-1.5 text-sm font-bold outline-none"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-mid)",
                      color: "var(--accent-primary)",
                    }}
                  />
                </div>
              )}


              {/* Napválasztó */}
              {notifSettings.enabled && notifSettings.dailyReminderEnabled && (
                <div className="pl-12">
                  <div className="text-xs mb-2" style={{color:"var(--text-muted)"}}>Melyik napokon:</div>
                  <div className="flex gap-1.5">
                    {["H","K","Sz","Cs","P","Szo","V"].map((d,i) => {
                      const active = (notifSettings.reminderDays ?? [0,1,2,3,4]).includes(i);
                      return (
                        <button key={i}
                          onClick={() => {
                            const cur = notifSettings.reminderDays ?? [0,1,2,3,4];
                            const next = active ? cur.filter(x=>x!==i) : [...cur,i].sort();
                            setNotifSettings(s => ({...s, reminderDays: next}));
                          }}
                          className="w-8 h-8 rounded-xl text-xs font-black pressable"
                          style={active
                            ? {background:"var(--accent-primary)",color:"#000"}
                            : {background:"var(--bg-card)",color:"var(--text-muted)"}}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Streak break */}
              <SettingRow
                icon="🔥"
                title={t.settings.notif_streak}
                subtitle={`Ha ${notifSettings.streakBreakAfterDays} napja nem edzettél`}
                right={
                  <Toggle
                    value={notifSettings.streakBreakEnabled}
                    onChange={v => setNotifSettings(s => ({ ...s, streakBreakEnabled: v }))}
                    disabled={!notifSettings.enabled}
                  />
                }
              />

              {/* Post-workout */}
              <SettingRow
                icon="🏆"
                title={t.settings.notif_post}
                subtitle={t.settings.notif_post_sub}
                right={
                  <Toggle
                    value={notifSettings.postWorkoutEnabled}
                    onChange={v => setNotifSettings(s => ({ ...s, postWorkoutEnabled: v }))}
                    disabled={!notifSettings.enabled}
                  />
                }
              />

              {/* Teszt gomb */}
              {notifSettings.enabled && permission === "granted" && (
                <button
                  onClick={handleTestNotification}
                  className="w-full rounded-2xl py-3 text-sm font-bold pressable mt-1"
                  style={{
                    background: testSent
                      ? "rgba(74,222,128,0.15)"
                      : "rgba(34,211,238,0.08)",
                    color: testSent ? "#4ade80" : "var(--accent-primary)",
                    border: `1px solid ${testSent ? "rgba(74,222,128,0.3)" : "rgba(34,211,238,0.2)"}`,
                  }}
                >
                  {testSent ? t.settings.notif_sent : t.settings.notif_test}
                </button>
              )}

              {permission === "denied" && (
                <div className="rounded-2xl p-3 text-xs"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>
                  Az értesítések blokkolva vannak. Engedélyezd a böngésző beállításokban, majd töltsd újra az oldalt.
                </div>
              )}
            </>
          )}
        </Section>

        {/* SZINKRON */}
        <Section title={t.settings.sync_section}>
          <SyncStatusCard />
          <MigrateLocalWorkoutsCard />
        </Section>

        {/* APP INFO */}
        <Section title={t.settings.app_section}>
          <SettingRow icon="📱" title={t.settings.app_name} subtitle={t.settings.app_sub} />
          <SettingRow icon="🔒" title={t.settings.app_offline} subtitle={t.settings.app_offline_sub} />
          <SettingRow
            icon="⭐"
            title={t.settings.app_profile}
            subtitle={t.settings.app_profile_sub}
            right={<span style={{ color: "var(--text-muted)" }}>→</span>}
            onPress={() => router.push("/profile")}
          />
        </Section>

        {/* FIÓK */}
        <Section title={t.settings.account_section}>
          {/* Google összekapcsolás */}
          {fbUser && (
            <div className="space-y-3">
              <div className="text-xs pb-1" style={{color:"var(--text-muted)"}}>
                Belépve: <span style={{color:"var(--text-primary)",fontWeight:600}}>{fbUser.email}</span>
              </div>

              {linkMsg && (
                <div className="rounded-2xl px-3 py-2.5 text-xs"
                  style={{
                    background: linkMsg.ok ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)",
                    color: linkMsg.ok ? "#4ade80" : "#fca5a5",
                    border: `1px solid ${linkMsg.ok ? "rgba(74,222,128,0.25)" : "rgba(239,68,68,0.25)"}`,
                  }}>
                  {linkMsg.text}
                </div>
              )}

              {isGoogleLinked ? (
                <SettingRow
                  icon="🔗"
                  title="Google összekapcsolva"
                  subtitle="Google-lel és email/jelszóval is beléphetsz"
                  right={
                    <button onClick={handleGoogleUnlink} disabled={linkBusy}
                      className="rounded-xl px-3 py-1.5 text-xs pressable"
                      style={{background:"rgba(239,68,68,0.1)",color:"#f87171",border:"1px solid rgba(239,68,68,0.2)"}}>
                      {linkBusy ? "..." : "Leválaszt"}
                    </button>
                  }
                />
              ) : (
                <button onClick={handleGoogleLink} disabled={linkBusy}
                  className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 pressable"
                  style={{background:"var(--bg-card)",border:"1px solid var(--border-mid)"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <div className="text-left flex-1">
                    <div className="text-sm font-semibold" style={{color:"var(--text-primary)"}}>
                      {linkBusy ? "Összekapcsolás..." : "Google összekapcsolása"}
                    </div>
                    <div className="text-xs" style={{color:"var(--text-muted)"}}>
                      Ezután Google-lel is beléphetsz
                    </div>
                  </div>
                </button>
              )}
            </div>
          )}
          <SignOutCard />
        </Section>

      </div>
      <BottomNav />
    </main>
  );
}
