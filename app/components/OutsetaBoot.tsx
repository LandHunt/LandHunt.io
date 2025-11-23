"use client";

import { useEffect } from "react";

/**
 * Loads Outseta once, exposes window.__outsetaReady (Promise),
 * and posts to /api/session on first token receipt.
 *
 * Required env:
 *   NEXT_PUBLIC_OUTSETA_DOMAIN=your-subdomain.outseta.com
 * Optional:
 *   NEXT_PUBLIC_OUTSETA_PUBLIC_KEY=pk_xxx
 */
export default function OutsetaBoot() {
  useEffect(() => {
    const w = window as any;
    if (w.__outsetaBooted) return;
    w.__outsetaBooted = true;

    let resolveReady: (o: any) => void;
    w.__outsetaReady = new Promise((res) => (resolveReady = res));

    const domain = process.env.NEXT_PUBLIC_OUTSETA_DOMAIN;
    const pubKey = process.env.NEXT_PUBLIC_OUTSETA_PUBLIC_KEY;

    if (!domain) {
      console.warn(
        "[OutsetaBoot] NEXT_PUBLIC_OUTSETA_DOMAIN is not set. Buttons will fall back to hosted login."
      );
    }

    const s = document.createElement("script");
    s.src = "https://cdn.outseta.com/outseta.min.js";
    s.async = true;
    if (domain) s.setAttribute("data-domain", domain);
    if (pubKey) s.setAttribute("data-public-key", pubKey);

    s.onload = () => {
      const O = w.Outseta;
      if (O) {
        resolveReady(O);
        wireTokenListener(O);
      } else {
        // poll briefly in rare delayed init cases
        const t = setInterval(() => {
          if (w.Outseta) {
            clearInterval(t);
            resolveReady(w.Outseta);
            wireTokenListener(w.Outseta);
          }
        }, 50);
        setTimeout(() => clearInterval(t), 5000);
      }
    };

    s.onerror = () => {
      console.error("[OutsetaBoot] Failed to load Outseta script.");
      // __outsetaReady will never resolve; buttons will use fallback.
    };

    document.head.appendChild(s);

    function wireTokenListener(Outseta: any) {
      const already = () => localStorage.getItem("lh_session_set") === "1";
      const mark = () => localStorage.setItem("lh_session_set", "1");

      const syncCookieOnce = async () => {
        if (already()) return;
        try {
          await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ set: true }),
          });
          mark();
        } catch (e) {
          console.error("Failed to set lh_session:", e);
        }
      };

      Outseta.on?.("accessToken.set", syncCookieOnce);
    }

    w.__lhClearSession = async () => {
      try {
        await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ set: false }),
        });
      } finally {
        localStorage.removeItem("lh_session_set");
      }
    };
  }, []);

  return null;
}
