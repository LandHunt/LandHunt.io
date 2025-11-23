import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL, // Prisma v7 style
});

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json().catch(() => ({}));
    if (!email || !EMAIL_RX.test(String(email))) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      // @ts-expect-error: not typed on NextRequest
      req.ip ||
      undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const sub = await prisma.subscriber.upsert({
      where: { email: email.toLowerCase() },
      update: { ip, userAgent, source },
      create: { email: email.toLowerCase(), ip, userAgent, source },
    });

    return NextResponse.json({ ok: true, id: sub.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
