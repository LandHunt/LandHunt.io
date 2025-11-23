// app/components/NavBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    Outseta?: any;
    __outsetaReady?: Promise<any>;
  }
}

const fontFamily =
  "-apple-system, BlinkMacSystemFont, system-ui, 'SF Pro Text', sans-serif";

export default function NavBar() {
  const pathname = usePathname();

  // 🚫 Hide the entire navbar on the landing page
  if (pathname === "/") return null;

  const [user, setUser] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const O =
        (await (window.__outsetaReady || Promise.resolve(window.Outseta))) ||
        null;
      if (!O?.getUser) return;
      setAuthReady(true);
      try {
        const u = await O.getUser();
        if (!cancelled) setUser(u || null);
      } catch {}
      O.on?.("accessToken.set", async () => {
        try {
          const u = await O.getUser();
          if (!cancelled) setUser(u || null);
        } catch {}
      });
    })();
    return () => { cancelled = true; };
  }, []);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(href + "/");

  const tabs = [
    { href: "/dashboard", label: "Explore" },
    { href: "/projects", label: "My Sites" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/clients", label: "My Clients" },
    { href: "/companies", label: "Companies" },
  ];

  async function openAuth(type: "login" | "signup") {
    const O =
      (await (window.__outsetaReady || Promise.resolve(window.Outseta))) ||
      null;
    if (O?.auth?.open) O.auth.open({ type, mode: "popup" });
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 16,
        right: 16,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily,
      }}
    >
      {/* left: tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: 4,
          borderRadius: 999,
          background: "rgba(15,23,42,0.94)",
          border: "1px solid rgba(30,64,175,0.6)",
          boxShadow: "0 12px 25px rgba(15,23,42,0.7)",
        }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 500,
                textDecoration: "none",
                background: active
                  ? "linear-gradient(135deg,#2563eb,#1d4ed8)"
                  : "transparent",
                color: active ? "white" : "rgba(226,232,240,0.9)",
                border: active
                  ? "1px solid rgba(191,219,254,0.9)"
                  : "1px solid transparent",
                boxShadow: active
                  ? "0 10px 20px rgba(37,99,235,0.45)"
                  : "none",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* right: account */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {user ? (
          <>
            <button
              type="button"
              onClick={() => (window as any).Outseta?.profile.open({ mode: "popup" })}
              style={btnStyle}
              title={user?.Email}
            >
              {user?.FirstName || user?.Email || "Account"}
            </button>
            <a href="/api/outseta/logout" style={btnLinkStyle}>
              Log out
            </a>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => openAuth("login")}
              style={{ ...btnStyle, opacity: authReady ? 1 : 0.9 }}
              title={authReady ? "" : "Loading…"}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => openAuth("signup")}
              style={{ ...btnStylePrimary, opacity: authReady ? 1 : 0.9 }}
              title={authReady ? "" : "Loading…"}
            >
              Create account
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.35)",
  background: "rgba(15,23,42,0.95)",
  color: "white",
  cursor: "pointer",
  fontSize: 12.5,
};

const btnStylePrimary: React.CSSProperties = {
  ...btnStyle,
  border: "1px solid rgba(191,219,254,0.9)",
  background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
};

const btnLinkStyle: React.CSSProperties = {
  ...btnStyle,
  textDecoration: "none",
  display: "inline-block",
};
