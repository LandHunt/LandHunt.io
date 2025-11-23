// app/clients/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchWithOutseta } from "@/app/lib/fetchWithOutseta";

type Client = {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  stage?: "lead" | "active" | "won" | "lost";
  valueGBP?: number;
  tags?: string[];
  createdAt: string;
};

const font =
  "-apple-system, BlinkMacSystemFont, system-ui, 'SF Pro Text', sans-serif";

export default function ClientsPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchWithOutseta("/api/clients", { method: "GET", cache: "no-store" });
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          throw new Error(j?.error || `Failed to load (${res.status})`);
        }
        const data = (await res.json()) as Client[];
        if (!cancelled) setClients(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load clients");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return clients;
    const needle = q.toLowerCase();
    return clients.filter((c) =>
      [
        c.name,
        c.company,
        c.email,
        c.phone,
        c.stage,
        ...(c.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [q, clients]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(1200px 600px at 20% -10%, #0b1220, #020617)",
        color: "#f9fafb",
        fontFamily: font,
        padding: 20,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "70px auto 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>My Clients</div>
            <h1 style={{ margin: 0 }}>{clients.length} total clients</h1>
          </div>
          <Link
            href="/clients/new"
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: "1px solid rgba(34,197,94,0.8)",
              background:
                "linear-gradient(135deg,rgba(22,163,74,0.98),rgba(22,163,74,0.92))",
              color: "#f9fafb",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 10px 22px rgba(22,163,74,0.6)",
            }}
          >
            New client
          </Link>
        </div>

        <div style={{ height: 12 }} />

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone, company, tags..."
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(148,163,184,0.85)",
            background: "rgba(15,23,42,0.95)",
            color: "#f9fafb",
            outline: "none",
            fontSize: 13.5,
          }}
        />
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
          Showing {filtered.length} / {clients.length}
        </div>

        <div style={{ height: 14 }} />

        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(51,65,85,0.9)",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95))",
            boxShadow: "0 20px 50px rgba(15,23,42,0.95)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1.2fr 0.8fr 0.8fr",
              gap: 8,
              padding: "10px 12px",
              borderBottom: "1px solid rgba(51,65,85,0.9)",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 0.3,
              opacity: 0.9,
            }}
          >
            <div>Name</div>
            <div>Company</div>
            <div>Contact</div>
            <div>Stage</div>
            <div>Value (GBP)</div>
          </div>

          <div style={{ display: "grid" }}>
            {loading ? (
              <div style={{ padding: 14, fontSize: 13.5, opacity: 0.9 }}>
                Loading clients…
              </div>
            ) : error ? (
              <div
                style={{
                  padding: 14,
                  fontSize: 13,
                  borderTop: "1px solid rgba(51,65,85,0.9)",
                  color: "#fecaca",
                }}
              >
                {error}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 14, fontSize: 13.5, opacity: 0.9 }}>
                No clients match your search.
              </div>
            ) : (
              filtered.map((c) => (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1.2fr 0.8fr 0.8fr",
                    gap: 8,
                    padding: "10px 12px",
                    borderTop: "1px solid rgba(51,65,85,0.6)",
                    textDecoration: "none",
                    color: "#f9fafb",
                    fontSize: 13.5,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div>{c.company || "—"}</div>
                  <div style={{ opacity: 0.9 }}>
                    {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                  </div>
                  <div style={{ textTransform: "capitalize" }}>{c.stage || "lead"}</div>
                  <div>
                    {typeof c.valueGBP === "number"
                      ? c.valueGBP.toLocaleString("en-GB")
                      : "—"}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
