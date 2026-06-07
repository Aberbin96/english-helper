import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await req.json();
  await prisma.user.update({
    where: { email: session.user.email },
    data: { pushSub: JSON.stringify(sub) },
  });
  return NextResponse.json({ ok: true });
}
