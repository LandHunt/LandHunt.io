import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

export async function POST(req: NextRequest) {
  try {
    const { email, token, password } = await req.json();
    if (!email || !token || !password) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }
    const row = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!row || row.identifier !== email || row.used || row.expires < new Date()) {
      return NextResponse.json({ ok: false, error: "Invalid or expired token" }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { email }, data: { passwordHash } });
    await prisma.passwordResetToken.update({ where: { token }, data: { used: true } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
