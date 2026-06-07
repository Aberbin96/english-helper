import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/webpush";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, body } = await req.json();
  if (!title || !body) return NextResponse.json({ error: "title and body required" }, { status: 400 });

  const users = await prisma.user.findMany({ where: { pushSub: { not: null } } });
  const results = await Promise.allSettled(
    users.map((u) => sendNotification(u.pushSub as string, { title, body }))
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  return NextResponse.json({ sent, failed });
}
