// app/api/signup/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 chars"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: any) {
    // Prisma / Zod / connectivity signals
    if (err?.name === "ZodError")
      return NextResponse.json({ error: err.errors?.[0]?.message ?? "Bad input" }, { status: 400 });
    if (err?.code === "P2002")
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    if (err?.code?.startsWith?.("P10"))
      return NextResponse.json({ error: "Database connection/migration issue" }, { status: 500 });

    console.error("Signup error:", { code: err?.code, message: err?.message, stack: err?.stack });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
