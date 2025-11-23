// app/clients/crm/page.tsx
"use client";

import React from "react";
import Link from "next/link";

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

export default function CrmPlaceholderPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% -10%, #020617, #020617)",
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
          <Link href="/projects" style={pill(false)}>
            My Sites
          </Link>
          <Link href="/marketplace" style={pill(false)}>
            Marketplace
          </Link>
          <Link href="/clients" style={pill(true)}>
            My Clients
          </Link>
        </div>
      </div>

      <div style={{ height: 56 }} />

      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: 20,
          display: "grid",
          placeItems: "center",
        }}
      >
        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(51,65,85,0.9)",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95))",
            boxShadow: "0 24px 55px rgba(15,23,42,0.95)",
            padding: 24,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            CRM board removed
          </div>
          <div style={{ fontSize: 13.5, opacity: 0.85 }}>
            The old drag-and-drop CRM board has been removed.
            <br />
            Manage everything from <strong>My Clients</strong> and{" "}
            <strong>My Sites</strong> instead.
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center" }}>
            <Link href="/clients" style={linkBtn}>
              Go to My Clients
            </Link>
            <Link href="/projects" style={linkBtn}>
              Go to My Sites
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid rgba(51,65,85,0.9)",
  background: "rgba(15,23,42,0.97)",
  color: "#f9fafb",
  textDecoration: "none",
  fontSize: 13,
};
