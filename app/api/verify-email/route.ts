import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

export async function POST(req: NextRequest) {
  try {
    const { email, token } = await req.json();
    if (!email || !token) return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });

    const vt = await prisma.verificationToken.findUnique({ where: { token } });
    if (!vt || vt.identifier !== email || vt.expires < new Date()) {
      return NextResponse.json({ ok: false, error: "Invalid or expired token" }, { status: 400 });
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });
    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
