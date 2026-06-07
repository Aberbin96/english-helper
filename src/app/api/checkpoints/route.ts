import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CHECKPOINTS } from "@/lib/checkpoints-data";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Ensure rows exist for current stage
  const stage = user.currentStage;
  const defs = CHECKPOINTS[stage] ?? [];
  for (const def of defs) {
    await prisma.checkpoint.upsert({
      where: { userId_stage_number: { userId: user.id, stage, number: def.number } },
      update: {},
      create: { userId: user.id, stage, number: def.number },
    });
  }

  const rows = await prisma.checkpoint.findMany({ where: { userId: user.id, stage } });
  return NextResponse.json({ stage, checkpoints: rows });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { stage, number, done } = await req.json();
  const row = await prisma.checkpoint.upsert({
    where: { userId_stage_number: { userId: user.id, stage, number } },
    update: { done, doneAt: done ? new Date() : null },
    create: { userId: user.id, stage, number, done, doneAt: done ? new Date() : null },
  });
  return NextResponse.json(row);
}
