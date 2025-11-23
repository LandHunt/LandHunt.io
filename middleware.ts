import { NextResponse, type NextRequest } from "next/server";

/** Public surface: only marketing + static + auth endpoints */
const PUBLIC = new Set<string>([
  "/",                // marketing
  "/api/session",     // writes cookie from client
  "/api/outseta/logout",
]);

const isPublic = (path: string) =>
  PUBLIC.has(path) ||
  path.startsWith("/_next") ||
  path.startsWith("/images") ||
  path === "/favicon.ico" ||
  path === "/robots.txt" ||
  path === "/sitemap.xml" ||
  path.startsWith("/api/") // allow other APIs through
;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthed = req.cookies.get("lh_session")?.value === "1";

  if (!isAuthed && !isPublic(pathname)) {
    // not authed -> only redirect if not already on "/"
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Optional: if authed and on marketing, send to dashboard (avoid same-route redirect)
  if (isAuthed && pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // run on all routes except static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
