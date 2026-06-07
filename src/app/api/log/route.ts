import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function todayUTC() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const log = await prisma.dailyLog.findFirst({
    where: { userId: user.id, date: todayUTC() },
  });
  return NextResponse.json({ blocks: (log?.blocks ?? {}) });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { blocks } = await req.json();

  const log = await prisma.dailyLog.upsert({
    where: { userId_date: { userId: user.id, date: todayUTC() } },
    update: { blocks },
    create: { userId: user.id, date: todayUTC(), blocks },
  });
  return NextResponse.json({ blocks: log.blocks });
}
