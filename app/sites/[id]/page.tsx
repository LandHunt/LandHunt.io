// app/sites/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { fetchSites } from "../_lib/siteApi";
import { fetchClients, Client } from "@/app/clients/_lib/clientApi";

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

export default function SiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<any | null>(null);

  const [clientsLoading, setClientsLoading] = useState(false);
  const [linkedClients, setLinkedClients] = useState<Client[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const all = await fetchSites();
        const found = (all as any[]).find((s) => s.id === id);
        setSite(found ?? null);
      } catch (err) {
        console.error("Failed to load site", err);
        setSite(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // load clients linked via client.siteIds including this site id
  useEffect(() => {
    if (!site?.id) {
      setLinkedClients([]);
      return;
    }
    (async () => {
      try {
        setClientsLoading(true);
        const all = await fetchClients();
        const related = (all as Client[]).filter((c) =>
          ((c as any).siteIds ?? []).includes(site.id)
        );
        setLinkedClients(related);
      } catch (err) {
        console.error("Failed to load linked clients", err);
        setLinkedClients([]);
      } finally {
        setClientsLoading(false);
      }
    })();
  }, [site?.id]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(1200px 600px at 20% -10%, #0b1220, #020617)",
          color: "#f9fafb",
          fontFamily: font,
          display: "grid",
          placeItems: "center",
          fontSize: 14,
        }}
      >
        Loading site…
      </div>
    );
  }

  if (!site) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(1200px 600px at 20% -10%, #0b1220, #020617)",
          color: "#f9fafb",
          fontFamily: font,
          display: "grid",
          placeItems: "center",
        }}
      >
        Site not found.
      </div>
    );
  }

  const siteName = site.name || site.address || "Untitled site";
  const address = site.address ?? "";
  const status = site.status ?? "Not set";
  const sizeAcres =
    typeof site.sizeAcres === "number" ? `${site.sizeAcres} acres` : "—";
  const valueGBP =
    typeof site.valueGBP === "number"
      ? `£${site.valueGBP.toLocaleString()}`
      : "—";
  const lat =
    typeof site.lat === "number" ? site.lat.toFixed(6) : "Not recorded";
  const lng =
    typeof site.lng === "number" ? site.lng.toFixed(6) : "Not recorded";
  const createdAt = site.createdAt
    ? new Date(site.createdAt).toLocaleString()
    : "Unknown";

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
        {/* Header card */}
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(51,65,85,0.9)",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95))",
            boxShadow: "0 20px 50px rgba(15,23,42,0.95)",
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>
                Site
              </div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{siteName}</div>
              <div style={{ marginTop: 6, fontSize: 12.5, opacity: 0.9 }}>
                {address || "No address set"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => router.push("/projects")}
                style={btnSecondary}
              >
                Back to My Sites
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.2fr",
            gap: 14,
          }}
        >
          {/* Left: details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={card}>
              <div style={cardHeader}>Details</div>
              <div style={{ padding: 14, fontSize: 13.5 }}>
                <Row label="Status" value={status} />
                <Row label="Size" value={sizeAcres} />
                <Row label="Estimated value" value={valueGBP} />
                <Row label="Latitude" value={lat} />
                <Row label="Longitude" value={lng} />
                <Row label="Notes" value={site.notes || "—"} />
                <Row label="Created" value={createdAt} />
              </div>
            </div>

            {/* Linked clients */}
            <div style={card}>
              <div style={cardHeader}>Linked clients</div>
              <div style={{ padding: 14, fontSize: 12.5 }}>
                {clientsLoading ? (
                  <div style={{ opacity: 0.85 }}>Loading linked clients…</div>
                ) : linkedClients.length === 0 ? (
                  <div style={{ opacity: 0.85 }}>
                    No clients linked to this site yet.
                    <br />
                    Open a client in <strong>My Clients</strong> and tick this
                    site under <em>Linked sites</em> to link them here.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {linkedClients.map((c) => (
                      <Link
                        key={c.id}
                        href={`/clients/${c.id}`}
                        style={{
                          textDecoration: "none",
                          borderRadius: 10,
                          border: "1px solid rgba(51,65,85,0.9)",
                          padding: 10,
                          background:
                            "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95))",
                          color: "#f9fafb",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            marginBottom: 2,
                          }}
                        >
                          {c.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            opacity: 0.9,
                            marginBottom: 2,
                          }}
                        >
                          {[c.company, c.email, c.phone]
                            .filter(Boolean)
                            .join(" · ") || "No contact details saved"}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            opacity: 0.8,
                            textTransform: "uppercase",
                            letterSpacing: 0.06,
                          }}
                        >
                          {(c.stage || "lead").toString()}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: shortcuts/meta */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={card}>
              <div style={cardHeader}>Shortcuts</div>
              <div style={{ padding: 14, display: "grid", gap: 8 }}>
                <Link href="/projects" style={linkBtn}>
                  ← Back to My Sites
                </Link>
                <Link href="/clients" style={linkBtn}>
                  View My Clients
                </Link>
                <Link href="/dashboard" style={linkBtn}>
                  Open Explore map
                </Link>
              </div>
            </div>

            <div style={card}>
              <div style={cardHeader}>Meta</div>
              <div style={{ padding: 14, fontSize: 12.5, opacity: 0.9 }}>
                <div>
                  <strong>ID:</strong> {site.id}
                </div>
                <div>
                  <strong>Created:</strong> {createdAt}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Small helpers */

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        gap: 10,
        padding: "6px 0",
      }}
    >
      <div style={{ opacity: 0.85 }}>{label}</div>
      <div>{value}</div>
    </div>
  );
}

const card: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(51,65,85,0.9)",
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95))",
  boxShadow: "0 20px 50px rgba(15,23,42,0.95)",
};

const cardHeader: React.CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid rgba(51,65,85,0.9)",
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: 0.3,
  opacity: 0.9,
};

const btnSecondary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.7)",
  background: "transparent",
  color: "rgba(226,232,240,0.95)",
  fontSize: 13,
  cursor: "pointer",
};

const linkBtn: React.CSSProperties = {
  display: "block",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(51,65,85,0.9)",
  background: "rgba(15,23,42,0.97)",
  color: "#f9fafb",
  textDecoration: "none",
  fontSize: 13,
};
