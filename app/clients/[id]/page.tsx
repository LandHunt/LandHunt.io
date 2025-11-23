// app/clients/[id]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { Site } from "@/app/clients/_lib/types";
import { fetchSites } from "@/app/sites/_lib/siteApi";
import {
  fetchClient,
  updateClient,
  deleteClientApi,
  addActivityApi,
  uploadDocumentApi,
  deleteDocumentApi,
  fetchClientsByCompany, // <-- used for @-mention inference (optional) and consistent typing
  Client,
  ClientStage,
} from "../_lib/clientApi";
import type { ActivityType, ClientDocument } from "../_lib/types";

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

type ProjectRef = { id: string; name: string };

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // contact fields (stage/value kept but hidden)
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState(""); // <-- NEW
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [valueGBP, setValueGBP] = useState<number | "">("");
  const [stage, setStage] = useState<ClientStage>("lead");
  const [tags, setTags] = useState<string>("");

  // linked sites
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [linkedSiteIds, setLinkedSiteIds] = useState<string[]>([]);
  const [linksEditing, setLinksEditing] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const [originalLinks, setOriginalLinks] = useState<string[]>([]);

  // notes
  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState<ActivityType>("note");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionList, setShowMentionList] = useState(false);

  // documents
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteDocConfirmId, setDeleteDocConfirmId] = useState<string | null>(null);

  // ----- load client -----
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const c = await fetchClient(id);
      if (c) {
        setClient(c);
        setName(c.name || "");
        setCompany(c.company || "");
        setJobTitle((c as any).jobTitle || ""); // <-- NEW
        setEmail(c.email || "");
        setPhone(c.phone || "");
        setStage((c.stage as ClientStage) || "lead");
        setValueGBP(typeof c.valueGBP === "number" ? c.valueGBP : "");
        setTags((c.tags ?? []).join(", "));
        const siteIds = ((c as any).siteIds ?? []) as string[];
        setLinkedSiteIds(siteIds);
        setOriginalLinks(siteIds);
      } else {
        setClient(null);
      }
      setLoading(false);
    })();
  }, [id]);

  // load all sites
  useEffect(() => {
    (async () => {
      try {
        const sites = await fetchSites();
        setAllSites(sites);
      } catch (err) {
        console.error("Failed to load sites for client linking", err);
      }
    })();
  }, []);

  const activity = useMemo(() => client?.activity ?? [], [client]);
  const documents: ClientDocument[] = useMemo(
    () => (client?.documents ?? []) as ClientDocument[],
    [client]
  );

  // ----- save contact (now includes jobTitle) -----
  async function saveContact() {
    if (!client || !id) return;
    const updated = await updateClient(id, {
      name: name.trim(),
      company: company.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined, // <-- NEW
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      stage,
      valueGBP: valueGBP === "" ? undefined : Number(valueGBP),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    } as any);
    if (updated) {
      setClient((prev) => ({ ...(prev as Client), ...updated }));
      setEditing(false);
    }
  }

  // ----- linked sites save (unchanged) -----
  async function saveLinkedSites() {
    if (!client || !id) return;
    setSavingLinks(true);
    try {
      const updated = await updateClient(id, { siteIds: linkedSiteIds } as any);
      if (updated) {
        setClient((prev) => (prev ? ({ ...prev, siteIds: linkedSiteIds } as any) : prev));
        setOriginalLinks(linkedSiteIds);
        setLinksEditing(false);
      }
    } finally {
      setSavingLinks(false);
    }
  }

  const linksChanged =
    originalLinks.length !== linkedSiteIds.length ||
    originalLinks.some((x) => !linkedSiteIds.includes(x));

  // ----- notes + mentions (unchanged) -----
  function handleNoteChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setNote(value);
    const lastAt = value.lastIndexOf("@");
    if (lastAt === -1) {
      setShowMentionList(false);
      setMentionQuery("");
      return;
    }
    const afterAt = value.slice(lastAt + 1);
    if (afterAt.includes(" ") || afterAt.includes("\n")) {
      setShowMentionList(false);
      setMentionQuery("");
      return;
    }
    setMentionQuery(afterAt);
    setShowMentionList(true);
  }

  function selectProject(project: ProjectRef) {
    if (!note.includes("@")) return;
    const lastAt = note.lastIndexOf("@");
    const newValue = note.slice(0, lastAt + 1) + project.name + " ";
    setNote(newValue);
    setShowMentionList(false);
    setMentionQuery("");
  }

  async function addNote() {
    if (!client || !id || !note.trim()) return;
    const updated = await addActivityApi(id, { type: noteType, text: note.trim() });
    if (updated) {
      setClient(updated);
      setNote("");
      setShowMentionList(false);
      setMentionQuery("");
    }
  }

  // ----- documents (unchanged) -----
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setDocName("");
      return;
    }
    setSelectedFile(file);
    setDocName(file.name.replace(/\.[^/.]+$/, ""));
  }

  async function handleUploadDocument() {
    if (!client || !id || !selectedFile) return;
    const friendlyName = docName.trim() || selectedFile.name;

    setUploading(true);
    try {
      const updated = await uploadDocumentApi(id, selectedFile, friendlyName);
      if (updated) {
        setClient(updated);
        setSelectedFile(null);
        setDocName("");
        const inputEl = document.getElementById("doc-upload-input") as HTMLInputElement | null;
        if (inputEl) inputEl.value = "";
      }
    } finally {
      setUploading(false);
    }
  }

  async function toggleDeleteDocument(docId: string) {
    if (!client || !id) return;
    if (deleteDocConfirmId === docId) {
      const updated = await deleteDocumentApi(id, docId);
      if (updated) setClient(updated);
      setDeleteDocConfirmId(null);
    } else {
      setDeleteDocConfirmId(docId);
    }
  }

  async function remove() {
    if (!client || !id) return;
    if (confirm("Delete this client? This cannot be undone.")) {
      const ok = await deleteClientApi(id);
      if (ok) router.push("/clients");
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(1200px 600px at 20% -10%, #0b1220, #020617)", color: "#f9fafb", fontFamily: font, display: "grid", placeItems: "center", fontSize: 14 }}>
        Loading client…
      </div>
    );
  }
  if (!client) {
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(1200px 600px at 20% -10%, #0b1220, #020617)", color: "#f9fafb", fontFamily: font, display: "grid", placeItems: "center" }}>
        Client not found.
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(1200px 600px at 20% -10%, #0b1220, #020617)", color: "#f9fafb", fontFamily: font }}>
      {/* Top nav */}
      <div style={{ position: "fixed", top: 10, left: 16, zIndex: 30, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: 4, borderRadius: 999, background: "rgba(15,23,42,0.94)", border: "1px solid rgba(30,64,175,0.6)", boxShadow: "0 12px 25px rgba(15,23,42,0.7)" }}>
          <Link href="/dashboard" style={pill(false)}>Explore</Link>
          <Link href="/projects" style={pill(false)}>My Sites</Link>
          <Link href="/marketplace" style={pill(false)}>Marketplace</Link>
          <Link href="/clients" style={pill(true)}>My Clients</Link>
        </div>
      </div>

      <div style={{ height: 56 }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
        {/* Header */}
        <div style={{ borderRadius: 16, border: "1px solid rgba(51,65,85,0.9)", background: "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95))", boxShadow: "0 20px 50px rgba(15,23,42,0.95)", padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>Client</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{client.name}</div>
              <div style={{ marginTop: 6, fontSize: 12.5, opacity: 0.9 }}>
                {[client.company, (client as any).jobTitle, client.email, client.phone].filter(Boolean).join(" · ")}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => setEditing((v) => !v)} style={btnSecondary}>{editing ? "Cancel" : "Edit"}</button>
              <button onClick={remove} style={btnDanger}>Delete</button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr", gap: 14 }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Details */}
            <div style={card}>
              <div style={cardHeader}>Details</div>
              {!editing ? (
                <div style={{ padding: 14, fontSize: 13.5 }}>
                  <Row
                    label="Company"
                    value={
                      client.company ? (
                        <Link
                          href={`/companies/${encodeURIComponent(client.company)}`}
                          style={{ ...linkBtnInline }}
                          title="View people at this company"
                        >
                          {client.company}
                        </Link>
                      ) : (
                        "—"
                      )
                    }
                  />
                  <Row label="Job title" value={(client as any).jobTitle || "—"} />
                  <Row label="Email" value={client.email || "—"} />
                  <Row label="Phone" value={client.phone || "—"} />
                  <Row label="Tags" value={(client.tags ?? []).join(", ") || "—"} />
                  <Row label="Created" value={new Date(client.createdAt).toLocaleString()} />
                </div>
              ) : (
                <div style={{ padding: 14, fontSize: 13.5, display: "grid", gap: 10 }}>
                  <Field label="Name">
                    <input value={name} onChange={(e) => setName(e.target.value)} style={input} />
                  </Field>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Company">
                      <input value={company} onChange={(e) => setCompany(e.target.value)} style={input} />
                    </Field>
                    <Field label="Job title">
                      <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} style={input} />
                    </Field>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Email">
                      <input value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
                    </Field>
                    <Field label="Phone">
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} style={input} />
                    </Field>
                  </div>
                  <Field label="Tags (comma separated)">
                    <input value={tags} onChange={(e) => setTags(e.target.value)} style={input} />
                  </Field>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button onClick={() => setEditing(false)} style={btnSecondary}>Cancel</button>
                    <button onClick={saveContact} style={btnPrimary}>Save</button>
                  </div>
                </div>
              )}
            </div>

            {/* Linked Sites (same editor we finalized) */}
            <LinkedSitesCard
              allSites={allSites}
              linkedSiteIds={linkedSiteIds}
              onChange={setLinkedSiteIds}
              linksEditing={linksEditing}
              setLinksEditing={setLinksEditing}
              saveLinkedSites={saveLinkedSites}
              savingLinks={savingLinks}
              originalLinks={originalLinks}
              setOriginalLinks={setOriginalLinks}
            />

            {/* Activity (unchanged) */}
            <ActivityCard
              note={note}
              setNote={setNote}
              noteType={noteType}
              setNoteType={setNoteType}
              handleNoteChange={handleNoteChange}
              showMentionList={showMentionList}
              filteredProjects={(() => {
                // derive from sites
                const projects = allSites.map((s) => ({
                  id: s.id,
                  name: s.name || s.address || "Untitled site",
                }));
                if (!mentionQuery) return projects;
                const q = mentionQuery.toLowerCase();
                return projects.filter((p) => p.name.toLowerCase().includes(q));
              })()}
              selectProject={selectProject}
              addNote={addNote}
              activity={activity}
            />
          </div>

          {/* Right column */}
          <RightColumn
            documents={documents}
            handleFileChange={handleFileChange}
            docName={docName}
            setDocName={setDocName}
            selectedFile={selectedFile}
            uploading={uploading}
            handleUploadDocument={handleUploadDocument}
            deleteDocConfirmId={deleteDocConfirmId}
            toggleDeleteDocument={toggleDeleteDocument}
            client={client}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Small components extracted to keep file readable ---------- */

function LinkedSitesCard(props: {
  allSites: Site[];
  linkedSiteIds: string[];
  onChange: (v: string[]) => void;
  linksEditing: boolean;
  setLinksEditing: (v: boolean) => void;
  saveLinkedSites: () => Promise<void>;
  savingLinks: boolean;
  originalLinks: string[];
  setOriginalLinks: (v: string[]) => void;
}) {
  const {
    allSites,
    linkedSiteIds,
    onChange,
    linksEditing,
    setLinksEditing,
    saveLinkedSites,
    savingLinks,
    originalLinks,
    setOriginalLinks,
  } = props;

  const linksChanged =
    originalLinks.length !== linkedSiteIds.length ||
    originalLinks.some((x) => !linkedSiteIds.includes(x));

  return (
    <div style={card}>
      <div style={cardHeader}>Linked Sites</div>
      <div style={{ padding: 14, display: "grid", gap: 10 }}>
        {!linksEditing ? (
          <>
            <ChipsView siteIds={linkedSiteIds} allSites={allSites} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setOriginalLinks(linkedSiteIds);
                  setLinksEditing(true);
                }}
                style={btnSecondary}
              >
                Edit links
              </button>
            </div>
          </>
        ) : (
          <>
            <InlineLinkSitesEditor allSites={allSites} value={linkedSiteIds} onChange={onChange} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => {
                  onChange(originalLinks);
                  setLinksEditing(false);
                }}
                style={btnSecondary}
              >
                Cancel
              </button>
              <button
                onClick={saveLinkedSites}
                disabled={savingLinks || !linksChanged}
                style={{
                  ...btnPrimary,
                  opacity: savingLinks || !linksChanged ? 0.6 : 1,
                  cursor: savingLinks || !linksChanged ? "not-allowed" : "pointer",
                }}
              >
                {savingLinks ? "Saving…" : "Save links"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ActivityCard(props: {
  note: string;
  setNote: (v: string) => void;
  noteType: ActivityType;
  setNoteType: (t: ActivityType) => void;
  handleNoteChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showMentionList: boolean;
  filteredProjects: { id: string; name: string }[];
  selectProject: (p: { id: string; name: string }) => void;
  addNote: () => Promise<void>;
  activity: any[];
}) {
  const {
    note,
    setNote,
    noteType,
    setNoteType,
    handleNoteChange,
    showMentionList,
    filteredProjects,
    selectProject,
    addNote,
    activity,
  } = props;

  return (
    <div style={card}>
      <div style={cardHeader}>Activity</div>
      <div style={{ padding: 14 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.8)",
            background: "rgba(15,23,42,0.97)",
            padding: "4px 6px 4px 12px",
          }}
        >
          <input
            value={note}
            onChange={handleNoteChange}
            placeholder={
              noteType === "call"
                ? "Log a call note…"
                : noteType === "email"
                ? "Log an email note…"
                : "Add new note... (use @ to link a site)"
            }
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "#f9fafb",
              fontSize: 13.5,
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginRight: 4, fontSize: 14 }}>
            <button type="button" onClick={() => setNoteType("note")} style={noteCategoryIcon(noteType === "note")}>📝</button>
            <button type="button" onClick={() => setNoteType("email")} style={noteCategoryIcon(noteType === "email")}>✉️</button>
            <button type="button" onClick={() => setNoteType("call")} style={noteCategoryIcon(noteType === "call")}>📞</button>
            <span style={{ opacity: 0.7, marginLeft: 4 }}>👥</span>
          </div>
          <button onClick={addNote} style={{ ...btnPrimary, borderRadius: 999, padding: "8px 16px", fontSize: 13, marginLeft: 2 }}>
            Post
          </button>
        </div>

        {showMentionList && filteredProjects.length > 0 && (
          <div
            style={{
              marginTop: 6,
              borderRadius: 12,
              border: "1px solid rgba(51,65,85,0.9)",
              background: "linear-gradient(135deg, rgba(15,23,42,0.99), rgba(15,23,42,0.97))",
              maxHeight: 180,
              overflowY: "auto",
              fontSize: 12.5,
            }}
          >
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => selectProject(p)}
                style={{ padding: "8px 10px", cursor: "pointer", borderBottom: "1px solid rgba(30,64,175,0.35)" }}
              >
                {p.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: 14, paddingTop: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {activity.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.85 }}>No activity yet.</div>
        ) : (
          activity.map((a) => (
            <div
              key={a.id}
              style={{
                border: "1px solid rgba(30,64,175,0.6)",
                borderRadius: 10,
                padding: 10,
                background: "linear-gradient(135deg, rgba(15,23,42,0.99), rgba(15,23,42,0.97))",
                fontSize: 13,
              }}
            >
              <div style={{ opacity: 0.9, fontSize: 11, display: "flex", gap: 6, alignItems: "center" }}>
                <span>{iconForType(a.type)}</span>
                <span>{a.type.toUpperCase()} · {new Date(a.at).toLocaleString()}</span>
              </div>
              <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{a.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RightColumn(props: {
  documents: ClientDocument[];
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  docName: string;
  setDocName: (v: string) => void;
  selectedFile: File | null;
  uploading: boolean;
  handleUploadDocument: () => Promise<void>;
  deleteDocConfirmId: string | null;
  toggleDeleteDocument: (id: string) => Promise<void>;
  client: Client;
}) {
  const {
    documents,
    handleFileChange,
    docName,
    setDocName,
    selectedFile,
    uploading,
    handleUploadDocument,
    deleteDocConfirmId,
    toggleDeleteDocument,
    client,
  } = props;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Documents */}
      <div style={card}>
        <div style={cardHeader}>Documents</div>
        <div style={{ padding: 14, display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gap: 6, fontSize: 12.5 }}>
            <label style={{ opacity: 0.85 }}>Upload file</label>
            <input id="doc-upload-input" type="file" onChange={handleFileChange} style={{ fontSize: 12, color: "#e5e7eb" }} />
          </div>

          <div style={{ display: "grid", gap: 6, fontSize: 12.5 }}>
            <label style={{ opacity: 0.85 }}>Document name</label>
            <input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="e.g. Option Agreement – Site A" style={input} />
          </div>

          <button
            onClick={handleUploadDocument}
            disabled={!selectedFile || uploading}
            style={{
              ...btnPrimary,
              opacity: !selectedFile || uploading ? 0.6 : 1,
              cursor: !selectedFile || uploading ? "not-allowed" : "pointer",
              justifySelf: "flex-start",
            }}
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>

          <div style={{ marginTop: 6, borderTop: "1px solid rgba(51,65,85,0.9)", paddingTop: 10, display: "grid", gap: 8 }}>
            {documents.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.85 }}>No documents uploaded for this client yet.</div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    borderRadius: 10,
                    border: "1px solid rgba(30,64,175,0.6)",
                    padding: 10,
                    fontSize: 12.5,
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{doc.name}</div>
                      <div style={{ opacity: 0.85, fontSize: 11, marginTop: 2 }}>
                        {doc.fileName} · {new Date(doc.uploadedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <a href={doc.url} target="_blank" rel="noreferrer" style={linkBtnMini}>Open</a>
                    <a href={doc.url} download={doc.fileName} style={linkBtnMini}>Download</a>
                    <button onClick={() => toggleDeleteDocument(doc.id)} style={deleteDocConfirmId === doc.id ? btnDangerMini : btnGhostMini}>
                      {deleteDocConfirmId === doc.id ? "Confirm delete" : "Delete"}
                    </button>
                    {deleteDocConfirmId === doc.id && (
                      <button onClick={() => (window as any).setDeleteDocConfirmId?.(null)} style={btnGhostMini}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <div style={card}>
        <div style={cardHeader}>Shortcuts</div>
        <div style={{ padding: 14, display: "grid", gap: 8 }}>
          <Link href="/clients" style={linkBtn}>← Back to Clients</Link>
          <a
            href={client.email ? `mailto:${client.email}` : "#"}
            style={{ ...linkBtn, opacity: client.email ? 1 : 0.5, pointerEvents: client.email ? "auto" : "none" }}
          >
            ✉️ Email {client.email || ""}
          </a>
          <a
            href={client.phone ? `tel:${client.phone}` : "#"}
            style={{ ...linkBtn, opacity: client.phone ? 1 : 0.5, pointerEvents: client.phone ? "auto" : "none" }}
          >
            📞 Call {client.phone || ""}
          </a>
        </div>
      </div>

      {/* Meta */}
      <div style={card}>
        <div style={cardHeader}>Meta</div>
        <div style={{ padding: 14, fontSize: 12.5, opacity: 0.9 }}>
          <div><strong>Created:</strong> {new Date(client.createdAt).toLocaleString()}</div>
          <div><strong>ID:</strong> {client.id}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Helper bits from earlier version ---------- */
function ChipsView({ siteIds, allSites }: { siteIds: string[]; allSites: Site[] }) {
  const items = useMemo(() => {
    const map = new Map(allSites.map((s) => [s.id, s]));
    return siteIds
      .map((id) => map.get(id))
      .filter(Boolean)
      .map((s) => ({ id: s!.id, label: s!.name || s!.address || "Untitled site" }));
  }, [siteIds, allSites]);

  if (!items.length) {
    return <div style={{ fontSize: 12, opacity: 0.85 }}>No sites linked yet.</div>;
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((s) => (
        <Link key={s.id} href={`/sites/${s.id}`} style={sitePill}>
          {s.label}
        </Link>
      ))}
    </div>
  );
}

function InlineLinkSitesEditor({
  allSites,
  value,
  onChange,
}: {
  allSites: Site[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [q, setQ] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(0);
  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return allSites;
    return allSites.filter((s) => {
      const label = (s.name || s.address || "Untitled site").toLowerCase();
      return label.includes(term);
    });
  }, [q, allSites]);

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
    // reset search
    setQ("");
    setActiveIdx(0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filtered[activeIdx];
      if (target) toggle(target.id);
    }
  }

  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid rgba(37,99,235,0.8)",
    background: "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(37,99,235,0.9))",
    color: "#f9fafb",
    fontSize: 11.5,
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {value.length === 0 && <span style={{ fontSize: 12, opacity: 0.8 }}>No sites selected.</span>}
        {value.map((id) => {
          const s = allSites.find((x) => x.id === id);
          const label = s ? s.name || s.address || "Untitled site" : id;
          return (
            <span key={id} style={chipStyle}>
              {label}
              <button
                onClick={() => toggle(id)}
                style={{ border: "none", background: "transparent", color: "white", cursor: "pointer", opacity: 0.9 }}
                aria-label={`Remove ${label}`}
              >
                ✕
              </button>
            </span>
          );
        })}
      </div>

      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActiveIdx(0);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search sites by name or address…"
        style={input}
      />

      <div
        style={{
          marginTop: 2,
          maxHeight: 240,
          overflowY: "auto",
          display: "grid",
          gap: 6,
          border: "1px solid rgba(51,65,85,0.9)",
          borderRadius: 12,
          padding: 8,
          background: "linear-gradient(135deg, rgba(15,23,42,0.99), rgba(15,23,42,0.97))",
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.8 }}>No results. Try a different search.</div>
        ) : (
          filtered.map((s, idx) => {
            const label = s.name || s.address || "Untitled site";
            const selected = value.includes(s.id);
            const active = idx === activeIdx;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: active
                    ? "1px solid rgba(37,99,235,0.8)"
                    : "1px solid rgba(30,64,175,0.35)",
                  background: selected
                    ? "linear-gradient(135deg, rgba(37,99,235,0.35), rgba(37,99,235,0.25))"
                    : "transparent",
                  color: "#f9fafb",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 12.5 }}>{label}</span>
                <span style={{ opacity: selected ? 1 : 0.5 }}>{selected ? "✓ Linked" : "Link"}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ---------- Simple primitives ---------- */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, padding: "6px 0" }}>
      <div style={{ opacity: 0.85 }}>{label}</div>
      <div>{value}</div>
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

const iconForType = (type: ActivityType) => {
  switch (type) {
    case "call":
      return "📞";
    case "email":
      return "✉️";
    default:
      return "📝";
  }
};

/* Styles */
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
  padding: "10px 14px",
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
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.7)",
  background: "transparent",
  color: "rgba(226,232,240,0.95)",
  fontSize: 13,
  cursor: "pointer",
};
const btnDanger: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid rgba(239,68,68,0.8)",
  background:
    "linear-gradient(135deg,rgba(239,68,68,0.98),rgba(239,68,68,0.92))",
  color: "#f9fafb",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(239,68,68,0.6)",
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
const linkBtnInline: React.CSSProperties = {
  color: "#93c5fd",
  textDecoration: "underline",
  textUnderlineOffset: 2,
  cursor: "pointer",
  fontSize: 13.5,
};
const noteCategoryIcon = (active: boolean): React.CSSProperties => ({
  border: "none",
  background: "transparent",
  cursor: "pointer",
  opacity: active ? 1 : 0.5,
  fontSize: 15,
  padding: 2,
});
const linkBtnMini: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(51,65,85,0.9)",
  background: "rgba(15,23,42,0.97)",
  color: "#f9fafb",
  fontSize: 11.5,
  textDecoration: "none",
};
const btnGhostMini: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.75)",
  background: "transparent",
  color: "rgba(226,232,240,0.95)",
  fontSize: 11.5,
  cursor: "pointer",
};
const btnDangerMini: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(239,68,68,0.85)",
  background:
    "linear-gradient(135deg,rgba(239,68,68,0.99),rgba(239,68,68,0.93))",
  color: "#f9fafb",
  fontSize: 11.5,
  cursor: "pointer",
};
const sitePill: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid rgba(37,99,235,0.8)",
  background:
    "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(37,99,235,0.9))",
  color: "#f9fafb",
  fontSize: 11.5,
  textDecoration: "none",
  whiteSpace: "nowrap",
};
