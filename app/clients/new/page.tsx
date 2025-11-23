// app/clients/new/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { fetchWithOutseta } from "@/app/lib/fetchWithOutseta";

type Stage = "lead" | "active" | "won" | "lost";
const font = "-apple-system, BlinkMacSystemFont, system-ui, 'SF Pro Text', sans-serif";

export default function NewClientPage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [stage, setStage] = useState<Stage>("lead");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tags, setTags] = useState("");

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) { setError("Name is required"); return; }
    setCreating(true);
    setError(null);

    const res = await fetchWithOutseta("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        company: company.trim() || undefined,
        stage,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setError(j?.error || `Failed (${res.status})`);
      setCreating(false);
      return;
    }

    const created = await res.json() as { id: string };
    window.location.href = `/clients/${created.id}`;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(1200px 600px at 20% -10%, #0b1220, #020617)",
        color: "#f9fafb", fontFamily: font, padding: 20,
      }}
    >
      <div style={{ maxWidth: 720, margin: "70px auto 0" }}>
        <Link href="/clients" style={{ color: "#93c5fd", textDecoration: "none" }}>
          ← Back to My Clients
        </Link>

        <div
          style={{
            marginTop: 12, borderRadius: 16, border: "1px solid rgba(51,65,85,0.9)",
            background: "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95))",
            boxShadow: "0 20px 50px rgba(15,23,42,0.95)", padding: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>New client</h2>

          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {error && (
              <div
                style={{
                  border: "1px solid rgba(239,68,68,0.8)",
                  background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.1))",
                  borderRadius: 10, padding: 10, fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <Field label="Name *"><input value={name} onChange={e=>setName(e.target.value)} style={input}/></Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Company"><input value={company} onChange={e=>setCompany(e.target.value)} style={input}/></Field>
              <Field label="Stage">
                <select value={stage} onChange={e=>setStage(e.target.value as Stage)} style={input}>
                  <option value="lead">Lead</option>
                  <option value="active">Active</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Email"><input value={email} onChange={e=>setEmail(e.target.value)} style={input}/></Field>
              <Field label="Phone"><input value={phone} onChange={e=>setPhone(e.target.value)} style={input}/></Field>
            </div>

            <Field label="Tags (comma separated)">
              <input value={tags} onChange={e=>setTags(e.target.value)} style={input}/>
            </Field>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Link href="/clients" style={btnSecondary}>Cancel</Link>
              <button
                onClick={submit}
                disabled={!name.trim() || creating}
                style={{ ...btnPrimary, opacity: (!name.trim() || creating) ? 0.6 : 1 }}
              >
                {creating ? "Creating..." : "Create client"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, opacity: 0.85 }}>{label}</span>
      {children}
    </label>
  );
}

const input: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.85)", background: "rgba(15,23,42,0.95)",
  color: "#f9fafb", outline: "none", fontSize: 13.5,
};
const btnPrimary: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 999, border: "1px solid rgba(34,197,94,0.8)",
  background: "linear-gradient(135deg,rgba(22,163,74,0.98),rgba(22,163,74,0.92))",
  color: "#f9fafb", fontSize: 13, fontWeight: 600, cursor: "pointer",
  boxShadow: "0 10px 22px rgba(22,163,74,0.6)",
};
const btnSecondary: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 999, border: "1px solid rgba(148,163,184,0.7)",
  background: "transparent", color: "rgba(226,232,240,0.95)", fontSize: 13, textDecoration: "none",
};
