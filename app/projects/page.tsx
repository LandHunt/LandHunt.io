// app/projects/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchSites } from "@/app/sites/_lib/siteApi";
import type { Site } from "@/app/clients/_lib/types";

const font =
  "-apple-system, BlinkMacSystemFont, system-ui, 'SF Pro Text', sans-serif";

const pill = (active: boolean) => ({
  padding: "6px 14px",
  borderRadius: 999,
  fontSize: 12.5,
  fontWeight: 500,
  textDecoration: "none",
  background: active ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "transparent",
  color: active ? "white" : "rgba(226,232,240,0.9)",
  border: active ? "1px solid rgba(191,219,254,0.9)" : "1px solid transparent",
  boxShadow: active ? "0 10px 20px rgba(37,99,235,0.45)" : "none",
});

export default function ProjectsPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchSites();
        setSites(data);
      } catch (err) {
        console.error("Failed to load sites", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredSites = useMemo(() => {
    if (!search.trim()) return sites;
    const q = search.toLowerCase();
    return sites.filter((s) => {
      const parts = [
        s.name,
        s.address,
        s.notes,
        (s.tags ?? []).join(" "),
      ].filter(Boolean) as string[];
      return parts.some((p) => p.toLowerCase().includes(q));
    });
  }, [sites, search]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% -10%, #0b1220, #020617)",
        color: "#f9fafb",
        fontFamily: font,
      }}
    >
      {/* Top nav */}
      <div
        style={{
          position: "fixed",
          top: 10,
          left: 16,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
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
          <Link href="/dashboard" style={pill(false)}>
            Explore
          </Link>
          <Link href="/projects" style={pill(true)}>
            My Sites
          </Link>
          <Link href="/marketplace" style={pill(false)}>
            Marketplace
          </Link>
          <Link href="/clients" style={pill(false)}>
            My Clients
          </Link>
        </div>
      </div>

      <div style={{ height: 56 }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 650 }}>My Sites</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {loading
                ? "Loading sites…"
                : `${filteredSites.length} total site${
                    filteredSites.length === 1 ? "" : "s"
                  }`}
            </div>
          </div>

          <button
            onClick={() => router.push("/sites/new")}
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: "1px solid rgba(34,197,94,0.8)",
              background:
                "linear-gradient(135deg,rgba(22,163,74,0.98),rgba(22,163,74,0.92))",
              color: "#f9fafb",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 10px 22px rgba(22,163,74,0.6)",
            }}
          >
            New site
          </button>
        </div>

        {/* Search */}
        <div
          style={{
            marginBottom: 10,
            borderRadius: 999,
            padding: "6px 10px",
            border: "1px solid rgba(51,65,85,0.9)",
            background: "rgba(15,23,42,0.96)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14, opacity: 0.8 }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search site name, address, notes, tags..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "#f9fafb",
              fontSize: 13.5,
            }}
          />
          <div style={{ fontSize: 11, opacity: 0.7, marginRight: 6 }}>
            Showing {filteredSites.length} / {sites.length}
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            borderRadius: 14,
            border: "1px solid rgba(51,65,85,0.9)",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95))",
            boxShadow: "0 20px 50px rgba(15,23,42,0.95)",
            overflow: "hidden",
            fontSize: 13,
          }}
        >
          {/* head */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2.4fr 2.6fr 1.1fr 0.9fr 1.2fr",
              padding: "10px 12px",
              borderBottom: "1px solid rgba(51,65,85,0.9)",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 0.06,
              opacity: 0.8,
            }}
          >
            <div>Site</div>
            <div>Address / Notes</div>
            <div>Status</div>
            <div>Size (acres)</div>
            <div>Value / Actions</div>
          </div>

          {/* body */}
          {loading ? (
            <div style={{ padding: 14, fontSize: 12 }}>Loading sites…</div>
          ) : filteredSites.length === 0 ? (
            <div style={{ padding: 14, fontSize: 12, opacity: 0.8 }}>
              No sites found. Try adjusting your search.
            </div>
          ) : (
            filteredSites.map((s) => {
              const name = s.name || s.address || "Untitled site";
              const address = s.address || "—";
              const status = s.status || "Not set";
              const size =
                typeof s.sizeAcres === "number" ? s.sizeAcres.toString() : "—";
              const value =
                typeof s.valueGBP === "number"
                  ? `£${s.valueGBP.toLocaleString()}`
                  : "—";

              return (
                <div
                  key={s.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2.4fr 2.6fr 1.1fr 0.9fr 1.2fr",
                    padding: "9px 12px",
                    borderTop: "1px solid rgba(30,41,59,0.9)",
                    alignItems: "center",
                  }}
                >
                  {/* Site name (clickable, opens dashboard) */}
                  <div>
                    <Link
                      href={`/sites/${s.id}`}
                      style={{
                        textDecoration: "none",
                        color: "#e5e7eb",
                        fontWeight: 500,
                      }}
                    >
                      {name}
                    </Link>
                  </div>

                  {/* Address / notes */}
                  <div style={{ opacity: 0.85, fontSize: 12.5 }}>
                    {address}
                    {s.notes ? (
                      <>
                        <br />
                        <span style={{ opacity: 0.8 }}>{s.notes}</span>
                      </>
                    ) : null}
                  </div>

                  {/* Status */}
                  <div style={{ opacity: 0.9 }}>{status}</div>

                  {/* Size */}
                  <div style={{ opacity: 0.9 }}>{size}</div>

                  {/* Value + Open pill */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ opacity: 0.9 }}>{value}</span>
                    <Link href={`/sites/${s.id}`} style={openPill}>
                      Open
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const openPill: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid rgba(37,99,235,0.85)",
  background:
    "linear-gradient(135deg,rgba(37,99,235,0.98),rgba(37,99,235,0.9))",
  color: "#f9fafb",
  fontSize: 12,
  fontWeight: 500,
  textDecoration: "none",
  whiteSpace: "nowrap",
};
