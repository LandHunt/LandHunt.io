// app/api/private/route.ts
import { NextResponse } from "next/server";
import * as jose from "jose";

async function verifyOutsetaToken(token: string) {
  const JWKS = jose.createRemoteJWKSet(
    new URL("https://YOUR-SUBDOMAIN.outseta.com/.well-known/jwks.json")
  );
  const { payload } = await jose.jwtVerify(token, JWKS, {
    issuer: `https://YOUR-SUBDOMAIN.outseta.com/`,
  });
  return payload; // contains user info (sub/email/name/claims)
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = await verifyOutsetaToken(token);
    return NextResponse.json({ ok: true, sub: payload.sub });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
