"use client";

import { useEffect, useState } from "react";

type Blocks = {
  commute: boolean;
  grammar: boolean;
  diary: boolean;
  production: boolean;
};

const defaultBlocks: Blocks = {
  commute: false,
  grammar: false,
  diary: false,
  production: false,
};

const BLOCK_LABELS: { key: keyof Blocks; label: string; alwaysShow?: boolean }[] = [
  { key: "commute", label: "Commute/break listening", alwaysShow: true },
  { key: "grammar", label: "Evening grammar study (Tue/Thu)" },
  { key: "diary", label: "Bedtime diary entry", alwaysShow: true },
  { key: "production", label: "Weekend production session" },
];

export default function LogPage() {
  const [blocks, setBlocks] = useState<Blocks>(defaultBlocks);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/log")
      .then((r) => r.json())
      .then((d) => setBlocks({ ...defaultBlocks, ...d.blocks }));
  }, []);

  async function toggle(key: keyof Blocks) {
    const next = { ...blocks, [key]: !blocks[key] };
    setBlocks(next);
    setSaving(true);
    setSaved(false);
    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks: next }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const today = new Date();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  const isTueThu = today.getDay() === 2 || today.getDay() === 4;

  const visible = BLOCK_LABELS.filter((b) => {
    if (b.alwaysShow) return true;
    if (b.key === "grammar") return isTueThu;
    if (b.key === "production") return isWeekend;
    return false;
  });

  const done = visible.filter((b) => blocks[b.key]).length;
  const pct = visible.length ? Math.round((done / visible.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Today&apos;s Log</h1>
        <span className="text-sm text-gray-500">
          {saving ? "Saving…" : saved ? "Saved ✓" : `${pct}%`}
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="bg-white rounded-xl shadow-sm divide-y">
        {visible.map((b) => (
          <li key={b.key}>
            <button
              onClick={() => toggle(b.key)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span
                className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  blocks[b.key]
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "border-gray-300"
                }`}
              >
                {blocks[b.key] && "✓"}
              </span>
              <span
                className={`text-sm ${
                  blocks[b.key] ? "line-through text-gray-400" : "text-gray-800"
                }`}
              >
                {b.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
