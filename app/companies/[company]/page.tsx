// app/companies/[company]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  fetchClientsByCompany,
  createClientApi,
  Client,
} from "@/app/clients/_lib/clientApi";

const font =
  "-apple-system, BlinkMacSystemFont, system-ui, 'SF Pro Text', sans-serif";

export default function CompanyPeoplePage() {
  const { company } = useParams<{ company: string }>();
  const router = useRouter();
  const decodedCompany = decodeURIComponent(company || "");

  const [people, setPeople] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // add-person form
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const rows = await fetchClientsByCompany(decodedCompany);
      setPeople(rows);
      setLoading(false);
    })();
  }, [decodedCompany]);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    setSaving(true);
    const created = await createClientApi({
      name: name.trim(),
      company: decodedCompany,
      jobTitle: jobTitle.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      tags: [],
      // stage/valueGBP left as defaults
    });
    setSaving(false);
    if (!created) {
      setError("Failed to create person. Please try again.");
      return;
    }
    // Clear form & refresh list
    setName("");
    setJobTitle("");
    setEmail("");
    setPhone("");
    setAdding(false);

    // Option A: go to the new client
    router.push(`/clients/${created.id}`);

    // Option B (if you'd rather stay): comment the line above and uncomment below
    // const rows = await fetchClientsByCompany(decodedCompany);
    // setPeople(rows);
  }

  if (loading) {
    return (
      <div style={wrap}>
        <div style={card}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      {/* Header */}
      <div style={{ ...card, padding: 16 }}>
        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>
          Company
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            alignItems: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
            {decodedCompany}
          </h1>

          {!adding ? (
            <button onClick={() => setAdding(true)} style={btnPrimary}>
              + New person
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setAdding(false)} style={btnSecondary}>
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !name.trim()}
                style={{
                  ...btnPrimary,
                  opacity: saving || !name.trim() ? 0.6 : 1,
                  cursor: saving || !name.trim() ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving…" : "Save person"}
              </button>
            </div>
          )}
        </div>

        {adding && (
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {error && (
              <div
                style={{
                  fontSize: 12.5,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid rgba(239,68,68,0.7)",
                  background:
                    "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.1))",
                }}
              >
                {error}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Field label="Name">
                <input value={name} onChange={(e) => setName(e.target.value)} style={input} />
              </Field>
              <Field label="Job title">
                <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} style={input} />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Field label="Email">
                <input value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
              </Field>
              <Field label="Phone">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} style={input} />
              </Field>
            </div>
            {/* Company is fixed */}
            <Field label="Company">
              <input value={decodedCompany} readOnly style={{ ...input, opacity: 0.8 }} />
            </Field>
          </div>
        )}
      </div>

      {/* People list */}
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
          People
        </div>
        <div style={{ display: "grid", gap: 8, padding: 14 }}>
          {people.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              No people found for this company.
            </div>
          ) : (
            people.map((p) => (
              <Link
                key={p.id}
                href={`/clients/${p.id}`}
                style={personRow}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 12.5, opacity: 0.9 }}>
                    {(p as any).jobTitle || "—"}
                  </div>
                </div>
                <span style={{ opacity: 0.7 }}>→</span>
              </Link>
            ))
          )}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 12 }}>
        <Link
          href="/clients"
          style={{ color: "#93c5fd", textDecoration: "underline", textUnderlineOffset: 2 }}
        >
          ← Back to Clients
        </Link>
      </div>
    </div>
  );
}

/* UI bits */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, opacity: 0.85 }}>{label}</span>
      {children}
    </label>
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

const personRow: React.CSSProperties = {
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

const btnPrimary: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid rgba(34,197,94,0.8)",
  background:
    "linear-gradient(135deg,rgba(22,163,74,0.98),rgba(22,163,74,0.92))",
  color: "#f9fafb",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(22,163,74,0.6)",
};

const btnSecondary: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.7)",
  background: "transparent",
  color: "rgba(226,232,240,0.95)",
  fontSize: 13,
  cursor: "pointer",
};
