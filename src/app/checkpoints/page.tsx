"use client";

import { useEffect, useState } from "react";
import { CHECKPOINTS } from "@/lib/checkpoints-data";

type CheckpointRow = {
  id: string;
  stage: number;
  number: number;
  done: boolean;
  doneAt: string | null;
};

export default function CheckpointsPage() {
  const [stage, setStage] = useState(1);
  const [rows, setRows] = useState<CheckpointRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/checkpoints")
      .then((r) => r.json())
      .then((d) => {
        setStage(d.stage);
        setRows(d.checkpoints);
        setLoading(false);
      });
  }, []);

  async function toggle(number: number, current: boolean) {
    const res = await fetch("/api/checkpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, number, done: !current }),
    });
    const updated = await res.json();
    setRows((prev) =>
      prev.map((r) => (r.number === updated.number ? { ...r, done: updated.done, doneAt: updated.doneAt } : r))
    );
  }

  const defs = CHECKPOINTS[stage] ?? [];
  const allDone = defs.length > 0 && defs.every((d) => rows.find((r) => r.number === d.number)?.done);

  if (loading) {
    return <p className="text-gray-400 text-sm">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Stage {stage} Checkpoints</h1>

      {allDone && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 font-medium">
          All challenges complete! You&apos;re ready for Stage {stage + 1}. Update your stage in Settings.
        </div>
      )}

      <ul className="bg-white rounded-xl shadow-sm divide-y">
        {defs.map((def) => {
          const row = rows.find((r) => r.number === def.number);
          const done = row?.done ?? false;
          return (
            <li key={def.number}>
              <button
                onClick={() => toggle(def.number, done)}
                className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    done
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300"
                  }`}
                >
                  {done && "✓"}
                </span>
                <div className="space-y-0.5">
                  <p
                    className={`text-sm font-medium ${
                      done ? "line-through text-gray-400" : "text-gray-800"
                    }`}
                  >
                    Challenge {def.number}
                  </p>
                  <p className={`text-xs ${done ? "text-gray-400" : "text-gray-500"}`}>
                    {def.label}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
