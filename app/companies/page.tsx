// app/companies/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Client = {
  id: string;
  name: string;
  company?: string | null;
  jobTitle?: string | null;
};

const font = "-apple-system, BlinkMacSystemFont, system-ui, 'SF Pro Text', sans-serif";

export default function CompaniesIndexPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/clients", { cache: "no-store" });
      const rows: Client[] = res.ok ? await res.json() : [];
      setClients(rows);
      setLoading(false);
    })();
  }, []);

  const companies = useMemo(() => {
    // group by exact company (non-empty)
    const map = new Map<
      string,
      { name: string; count: number; titles: Set<string> }
    >();

    for (const c of clients) {
      const company = (c.company || "").trim();
      if (!company) continue;
      const key = company; // exact
      if (!map.has(key)) map.set(key, { name: company, count: 0, titles: new Set() });
      const rec = map.get(key)!;
      rec.count += 1;
      if (c.jobTitle) rec.titles.add(c.jobTitle);
    }

    let arr = Array.from(map.values());
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter((x) => x.name.toLowerCase().includes(s));
    }

    // sort: by count desc, name asc
    arr.sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name));
    return arr;
  }, [clients, q]);

  return (
    <div style={wrap}>
      <div style={{ ...card, padding: 16 }}>
        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>Directory</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Companies</h1>

        <div style={{ marginTop: 12 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search companies…"
            style={input}
          />
        </div>
      </div>

      <div style={{ ...card, padding: 0 }}>
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid rgba(51,65,85,0.9)",
            fontWeight: 700,
            fontSize: 13,
            opacity: 0.9,
          }}
        >
          {loading ? "Loading…" : `${companies.length} compan${companies.length === 1 ? "y" : "ies"}`}
        </div>

        <div style={{ display: "grid", gap: 8, padding: 14 }}>
          {loading ? (
            <div style={{ fontSize: 13, opacity: 0.85 }}>Loading…</div>
          ) : companies.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.85 }}>No companies yet.</div>
          ) : (
            companies.map((c) => (
              <Link
                key={c.name}
                href={`/companies/${encodeURIComponent(c.name)}`}
                style={row}
              >
                <div style={{ display: "grid" }}>
                  <div style={{ fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 12.5, opacity: 0.9 }}>
                    {c.count} contact{c.count === 1 ? "" : "s"} · {c.titles.size} title{c.titles.size === 1 ? "" : "s"}
                  </div>
                </div>
                <span style={{ opacity: 0.7 }}>→</span>
              </Link>
            ))
          )}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 12 }}>
        <Link href="/clients" style={{ color: "#93c5fd", textDecoration: "underline", textUnderlineOffset: 2 }}>
          ← Back to Clients
        </Link>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(1200px 600px at 20% -10%, #0b1220, #020617)",
  color: "#f9fafb",
  fontFamily: font,
  padding: 20,
  maxWidth: 900,
  margin: "0 auto",
};

const card: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(51,65,85,0.9)",
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95))",
  boxShadow: "0 20px 50px rgba(15,23,42,0.95)",
  marginBottom: 14,
};

const row: React.CSSProperties = {
  border: "1px solid rgba(51,65,85,0.9)",
  borderRadius: 12,
  padding: 12,
  textDecoration: "none",
  color: "#f9fafb",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.85)",
  background: "rgba(15,23,42,0.95)",
  color: "#f9fafb",
  outline: "none",
  fontSize: 13.5,
};
