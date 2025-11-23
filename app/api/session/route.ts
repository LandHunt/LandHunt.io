import { NextResponse, NextRequest } from "next/server";

/**
 * POST /api/session
 * Body: { set: boolean }  -> set or clear the HttpOnly cookie
 * Called from OutsetaBoot when Outseta emits accessToken.set
 */
export async function POST(req: NextRequest) {
  const { set } = await req.json().catch(() => ({ set: true }));

  const res = NextResponse.json({ ok: true });

  if (set) {
    // 30 days, lax so middleware can read it on navigations
    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set("lh_session", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,     // must be true on HTTPS
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } else {
    res.cookies.set("lh_session", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }

  return res;
}
