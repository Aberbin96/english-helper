export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const STAGE_DAYS = 60;

function stageName(stage: number) {
  return ["Foundation", "Consolidation", "Production"][stage - 1] ?? "Unknown";
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect("/auth/signin");

  const now = new Date();
  const totalDays = Math.floor(
    (now.getTime() - user.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const stageDaysElapsed = totalDays % STAGE_DAYS;
  const stageDaysLeft = STAGE_DAYS - stageDaysElapsed;

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const log = await prisma.dailyLog.findFirst({
    where: { userId: user.id, date: todayStart },
  });
  const blocks = (log?.blocks as Record<string, boolean>) ?? {};

  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const isTueThu = now.getDay() === 2 || now.getDay() === 4;

  const checklist = [
    { key: "commute", label: "Commute/break listening" },
    ...(isTueThu ? [{ key: "grammar", label: "Evening grammar study" }] : []),
    { key: "diary", label: "Bedtime diary entry" },
    ...(isWeekend
      ? [{ key: "production", label: "Weekend production session" }]
      : []),
  ];

  const done = checklist.filter((c) => blocks[c.key]).length;
  const pct = checklist.length ? Math.round((done / checklist.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-1">
        <div className="text-xs text-gray-400 uppercase tracking-wide">
          Stage {user.currentStage}
        </div>
        <h1 className="text-xl font-bold">{stageName(user.currentStage)}</h1>
        <p className="text-sm text-gray-500">
          Day {stageDaysElapsed} of {STAGE_DAYS} &mdash;{" "}
          <span className="font-medium text-gray-700">{stageDaysLeft} days left</span>
        </p>
        <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min((stageDaysElapsed / STAGE_DAYS) * 100, 100)}%` }}
          />
        </div>
      </section>

      <section className="bg-white rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Today</h2>
          <span className="text-sm text-gray-500">{pct}% done</span>
        </div>
        <ul className="space-y-2">
          {checklist.map((c) => (
            <li key={c.key} className="flex items-center gap-3 text-sm">
              <span
                className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs ${
                  blocks[c.key]
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "border-gray-300"
                }`}
              >
                {blocks[c.key] && "✓"}
              </span>
              <span className={blocks[c.key] ? "line-through text-gray-400" : ""}>
                {c.label}
              </span>
            </li>
          ))}
        </ul>
        <a
          href="/log"
          className="inline-block mt-1 text-xs text-blue-600 hover:underline"
        >
          Update today&apos;s log →
        </a>
      </section>
    </div>
  );
}
