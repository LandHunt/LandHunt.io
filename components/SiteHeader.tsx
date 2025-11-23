"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const active = pathname === href || (href === "/" && pathname === "/");
  return (
    <Link
      href={href}
      className={`navLink ${active ? "navLinkActive" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
};

export default function SiteHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="siteHeader">
      <div className="container headerWrap">
        <Link href="/" className="brandWrap" aria-label="Landhunt home">
          <span className="brandMark" aria-hidden />
          <span className="brandText">Landhunt</span>
        </Link>

        <nav className="primaryNav" aria-label="Primary">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/#pricing">Pricing</NavLink>
          <NavLink href="/#contact">Contact</NavLink>
          <NavLink href="/dashboard">Dashboard</NavLink>
        </nav>

        <div className="headerCtas">
          {status === "authenticated" ? (
            <details className="acctMenu">
              <summary className="acctButton">
                <span className="avatar">{session?.user?.name?.[0] ?? "U"}</span>
                <span className="acctName">{session?.user?.name ?? session?.user?.email}</span>
              </summary>
              <div className="menuSheet">
                <Link href="/dashboard" className="menuItem">Dashboard</Link>
                <Link href="/projects" className="menuItem">Projects</Link>
                <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="menuItem">
                  Sign out
                </button>
              </div>
            </details>
          ) : (
            <>
              <Link href="/login" className="btnGhost">Log in</Link>
              <Link href="/signup" className="btnPrimary">Sign up</Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <details className="mobileMenu">
          <summary className="mobileTrigger" aria-label="Toggle menu">☰</summary>
          <div className="mobileSheet">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/#pricing">Pricing</NavLink>
            <NavLink href="/#contact">Contact</NavLink>
            <NavLink href="/dashboard">Dashboard</NavLink>
            {status === "authenticated" ? (
              <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="btnGhost" style={{ width: "100%" }}>
                Sign out
              </button>
            ) : (
              <>
                <Link href="/login" className="btnGhost" style={{ width: "100%" }}>Log in</Link>
                <Link href="/signup" className="btnPrimary" style={{ width: "100%" }}>Sign up</Link>
              </>
            )}
          </div>
        </details>
      </div>
    </header>
  );
}
