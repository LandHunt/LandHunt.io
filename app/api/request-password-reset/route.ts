import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { sendEmail } from "@/lib/mailer";
import { rateLimit } from "@/lib/rateLimit";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const rl = await rateLimit(`pwdreq:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ ok: true }); // do not reveal

  const lower = String(email).toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: lower } });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1h
    await prisma.passwordResetToken.create({ data: { identifier: lower, token, expires } });

    const url = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}&email=${encodeURIComponent(lower)}`;
    await sendEmail({
      to: lower,
      subject: "Reset your Landhunt password",
      html: `<p>Reset your password:</p><p><a href="${url}">${url}</a></p>`,
    });
  }
  return NextResponse.json({ ok: true });
}
