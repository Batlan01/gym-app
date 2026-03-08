"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { SyncStatusCard } from "@/components/SyncStatusCard";
import { MigrateLocalWorkoutsCard } from "@/components/MigrateLocalWorkoutsCard";
import { SignOutCard } from "@/components/SignOutCard";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
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
  const router = useRouter();
  const [notifSettings, setNotifSettings] = useLocalStorageState<NotifSettings>(
    LS_NOTIF_SETTINGS, DEFAULT_NOTIF_SETTINGS
  );
  const [permission, setPermission] = React.useState<NotificationPermission>("default");
  const [supported, setSupported] = React.useState(false);
  const [testSent, setTestSent] = React.useState(false);

  React.useEffect(() => {
    setSupported(isNotificationsSupported());
    setPermission(getNotificationPermission());
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
        alert("Az értesítések blokkolva vannak. Engedélyezd a böngészőben.");
        return;
      }
    }
    setNotifSettings(s => ({ ...s, enabled: enable }));
  }

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
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Beállítások</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Értesítések, szinkron, fiók</p>
      </header>

      <div className="space-y-4">

        {/* ÉRTESÍTÉSEK */}
        <Section title="🔔 ÉRTESÍTÉSEK">
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
                title="Értesítések bekapcsolása"
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
                title="Napi emlékeztető"
                subtitle="Minden nap figyelmeztet az edzésre"
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

              {/* Streak break */}
              <SettingRow
                icon="🔥"
                title="Streak veszély értesítés"
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
                title="Edzés utáni motiváció"
                subtitle="30 perccel az edzés után küld egy üzenetet"
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
                  {testSent ? "✓ Elküldve!" : "🔔 Teszt értesítés küldése"}
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
        <Section title="☁️ FELHŐ SZINKRON">
          <SyncStatusCard />
          <MigrateLocalWorkoutsCard />
        </Section>

        {/* APP INFO */}
        <Section title="ℹ️ APP">
          <SettingRow icon="📱" title="ARCX" subtitle="Edzésnapló PWA · v1.0" />
          <SettingRow icon="🔒" title="Offline-first" subtitle="Minden adat lokálban tárolódik" />
          <SettingRow
            icon="⭐"
            title="Profil & Achievements"
            subtitle="XP, szintek, achievementek"
            right={<span style={{ color: "var(--text-muted)" }}>→</span>}
            onPress={() => router.push("/profile")}
          />
        </Section>

        {/* FIÓK */}
        <Section title="👤 FIÓK">
          <SignOutCard />
        </Section>

      </div>
      <BottomNav />
    </main>
  );
}
