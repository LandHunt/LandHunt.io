"use client";

import { useEffect, useState, useMemo } from "react";

type Variant = "primary" | "ghost" | "primaryLg" | "secondaryLg";
type Status = "loading" | "ready" | "fallback";

export default function AuthButton({
  kind,
  label,
  variant = "primary",
  fallbackSeconds = 4_000, // after this, offer hosted login/signup
}: {
  kind: "login" | "signup";
  label: string;
  variant?: Variant;
  fallbackSeconds?: number;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [domain, setDomain] = useState<string | null>(null);

  useEffect(() => {
    const w = window as any;
    const d = process.env.NEXT_PUBLIC_OUTSETA_DOMAIN || null;
    setDomain(d);

    let cancelled = false;

    async function waitReady() {
      // race: either __outsetaReady resolves, or we time out and use fallback
      const readyPromise: Promise<any> =
        w.__outsetaReady ||
        new Promise((resolve) => {
          const t = setInterval(() => {
            if (w.__outsetaReady) {
              clearInterval(t);
              resolve(w.__outsetaReady);
            }
          }, 50);
          setTimeout(() => {
            clearInterval(t);
            resolve(null);
          }, 3000);
        });

      const timeout = new Promise<"timeout">((res) =>
        setTimeout(() => res("timeout"), fallbackSeconds)
      );

      const result = await Promise.race([readyPromise, timeout]);

      if (cancelled) return;

      if (result === "timeout") {
        setStatus("fallback");
        return;
      }

      try {
        const Outseta =
          (await (result as Promise<any>)?.catch?.(() => null)) ||
          (w as any).Outseta ||
          null;

        if (Outseta) setStatus("ready");
        else setStatus("fallback");
      } catch {
        setStatus("fallback");
      }
    }

    waitReady();
    return () => {
      cancelled = true;
    };
  }, [fallbackSeconds]);

  const style = useMemo(
    () => buttonStyleFor(variant, status === "loading"),
    [variant, status]
  );

  const onClick = async () => {
    if (status === "loading") return;

    const w = window as any;
    const Outseta: any =
      (await w.__outsetaReady?.catch?.(() => null)) || w.Outseta || null;

    if (status === "ready" && Outseta?.auth?.open) {
      Outseta.auth.open({ type: kind, mode: "popup" });
      return;
    }

    // Fallback: open hosted login/signup page if domain is configured
    if (domain) {
      const path = kind === "login" ? "login" : "signup";
      // Use hosted auth page (no popup needed)
      window.location.href = `https://${domain}/${path}`;
      return;
    }

    // Final safety: enable but explain missing config
    alert(
      "Authentication isn’t fully configured (missing NEXT_PUBLIC_OUTSETA_DOMAIN). " +
        "Please set it to your Outseta subdomain (e.g. landhunt.outseta.com)."
    );
  };

  const text =
    status === "loading"
      ? "Loading..."
      : status === "ready"
      ? label
      : // fallback text
        (kind === "login" ? "Open login" : "Create account");

  return (
    <button
      onClick={onClick}
      style={style}
      type="button"
      disabled={status === "loading"}
      aria-disabled={status === "loading"}
    >
      {text}
    </button>
  );
}

/* Styles */
function buttonStyleFor(variant: Variant, disabled: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };
  switch (variant) {
    case "ghost":
      return {
        ...base,
        padding: "10px 14px",
        border: "1px solid rgba(148,163,184,0.7)",
        background: "transparent",
        color: "rgba(226,232,240,0.95)",
      };
    case "primaryLg":
      return {
        ...base,
        padding: "12px 18px",
        fontSize: 13.5,
        border: "1px solid rgba(191,219,254,0.9)",
        background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
        color: "#f8fafc",
        boxShadow: "0 12px 26px rgba(37,99,235,0.5)",
      };
    case "secondaryLg":
      return {
        ...base,
        padding: "12px 18px",
        fontSize: 13.5,
        border: "1px solid rgba(148,163,184,0.75)",
        background: "transparent",
        color: "rgba(226,232,240,0.95)",
      };
    case "primary":
    default:
      return {
        ...base,
        padding: "10px 14px",
        border: "1px solid rgba(191,219,254,0.9)",
        background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
        color: "#f8fafc",
        boxShadow: "0 10px 22px rgba(37,99,235,0.45)",
      };
  }
}
