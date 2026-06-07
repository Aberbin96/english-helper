"use client";

import { useEffect, useState } from "react";

type NotifSettings = {
  morningEnabled: boolean;
  morningTime: string;
  eveningEnabled: boolean;
  eveningTime: string;
  bedtimeEnabled: boolean;
  bedtimeTime: string;
  weekendEnabled: boolean;
  weekendTime: string;
};

const defaults: NotifSettings = {
  morningEnabled: true,
  morningTime: "08:00",
  eveningEnabled: true,
  eveningTime: "20:30",
  bedtimeEnabled: true,
  bedtimeTime: "22:30",
  weekendEnabled: true,
  weekendTime: "10:00",
};

export default function SettingsPage() {
  const [stage, setStage] = useState(1);
  const [notif, setNotif] = useState<NotifSettings>(defaults);
  const [saving, setSaving] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "subscribed" | "denied" | "unsupported">("idle");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setStage(d.currentStage ?? 1);
        setNotif({ ...defaults, ...(d.notifSettings ?? {}) });
      });

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushStatus("unsupported");
    } else if (Notification.permission === "granted") {
      setPushStatus("subscribed");
    } else if (Notification.permission === "denied") {
      setPushStatus("denied");
    }
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentStage: stage, notifSettings: notif }),
    });
    setSaving(false);
  }

  async function subscribePush() {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub),
    });
    setPushStatus("subscribed");
  }

  function updateNotif<K extends keyof NotifSettings>(key: K, val: NotifSettings[K]) {
    setNotif((prev) => ({ ...prev, [key]: val }));
  }

  const notifRows = [
    { label: "Morning commute", enabledKey: "morningEnabled" as const, timeKey: "morningTime" as const },
    { label: "Evening study (Tue/Thu)", enabledKey: "eveningEnabled" as const, timeKey: "eveningTime" as const },
    { label: "Bedtime diary", enabledKey: "bedtimeEnabled" as const, timeKey: "bedtimeTime" as const },
    { label: "Weekend session", enabledKey: "weekendEnabled" as const, timeKey: "weekendTime" as const },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>

      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold">Stage</h2>
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                stage === s
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Stage {s}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold">Push Notifications</h2>
        {pushStatus === "unsupported" && (
          <p className="text-sm text-gray-500">Push not supported in this browser.</p>
        )}
        {pushStatus === "denied" && (
          <p className="text-sm text-red-500">Notifications blocked. Enable in browser settings.</p>
        )}
        {pushStatus === "subscribed" && (
          <p className="text-sm text-green-600">✓ Subscribed</p>
        )}
        {pushStatus === "idle" && (
          <button
            onClick={subscribePush}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Enable push notifications
          </button>
        )}

        <div className="space-y-3 pt-2">
          {notifRows.map((row) => (
            <div key={row.enabledKey} className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={notif[row.enabledKey]}
                  onChange={(e) => updateNotif(row.enabledKey, e.target.checked)}
                  className="rounded"
                />
                {row.label}
              </label>
              <input
                type="time"
                value={notif[row.timeKey]}
                onChange={(e) => updateNotif(row.timeKey, e.target.value)}
                disabled={!notif[row.enabledKey]}
                className="text-sm border rounded px-2 py-1 disabled:opacity-40"
              />
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
