// app/api/outseta/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  cookies().set("lh_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });

  const html = `<!doctype html>
  <meta http-equiv="refresh" content="0; url=/" />
  <script>
    try { window.Outseta?.auth.logout?.(); } catch {}
    location.replace("/");
  </script>`;
  return new NextResponse(html, { headers: { "content-type": "text/html" } });
}
