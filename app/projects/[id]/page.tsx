"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useProjects } from "../../context/ProjectsContext";
import { supabase } from "@/lib/supabaseClient";

const fontFamily =
  "-apple-system, BlinkMacSystemFont, system-ui, 'SF Pro Text', sans-serif";

/* ---------------------------- STAGES (static) ---------------------------- */

const STAGES = [
  { id: "uncategorised", label: "Uncategorised" },
  { id: "letter_sent", label: "Letter sent" },
  { id: "contact_made", label: "Contact made" },
  { id: "instructed", label: "Instructed" },
  { id: "sold", label: "Sold" },
] as const;

type StageId = (typeof STAGES)[number]["id"];

/* --------------------------------- TABS --------------------------------- */

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "contacts", label: "Contacts" },
  { id: "notes", label: "Notes & history" },
  { id: "documents", label: "Documents" },
  { id: "photos", label: "Photos" },
  { id: "site", label: "Site details & metrics" },
  { id: "offers", label: "Offers" },
  { id: "linked", label: "Linked parcels / sites" },
  { id: "planning", label: "Planning" },
  { id: "ppd", label: "PPD (sold history)" },
  { id: "gis", label: "GIS & data layers" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ----------------------------- Helper types ----------------------------- */

type PpdRow = {
  transaction_id: string;
  price: number;
  date: string;
  postcode: string;
  property_type: string | null;
  new_build: string | null;
  tenure: string | null;
  paon: string | null;
  saon: string | null;
  street: string | null;
  locality: string | null;
  town: string | null;
};

type PpdStatus = "idle" | "loading" | "ok" | "no-results" | "error";

type DocumentItem = {
  id: string;
  fileName: string;
  label: string;
  url?: string; // object URL for preview / open / download
  createdAt: string;
};

type PhotoItem = {
  id: string;
  fileName: string;
  url: string;
  isHero: boolean;
};

type OfferStatus = "sent" | "accepted" | "rejected" | "pending";

type OfferItem = {
  id: string;
  amount: string;
  date: string;
  status: OfferStatus;
  note: string;
};

type ReminderItem = {
  id: string;
  text: string;
  dueDate: string;
};

type ProjectCategory = {
  id: string;
  user_id: string | null;
  name: string;
  is_default: boolean;
};

function formatPropertyType(code: string | null): string {
  if (!code) return "";
  const map: Record<string, string> = {
    D: "detached house",
    S: "semi-detached house",
    T: "terraced house",
    F: "flat or maisonette",
    O: "other property",
  };
  return map[code] ?? code.toLowerCase();
}

function formatTenure(code: string | null): string {
  if (!code) return "";
  if (code === "F") return "Freehold";
  if (code === "L") return "Leasehold";
  return code;
}

/* ------------------------- Pill-style generic select ------------------------- */

type PillOption = { value: string; label: string };
const PillSelect: React.FC<{
  label: string;
  value: string;
  options: PillOption[];
  onChange: (v: string) => void;
  disabled?: boolean;
  minWidth?: number;
}> = ({ label, value, options, onChange, disabled, minWidth = 210 }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!btnRef.current) return;
      const el = btnRef.current;
      if (open && e.target instanceof Node && !el.parentElement?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div style={{ position: "relative", minWidth }}>
      <button
        type="button"
        ref={btnRef}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        style={{
          opacity: disabled ? 0.6 : 1,
          padding: "7px 14px",
          borderRadius: 999,
          border: "1px solid rgba(59,130,246,0.9)",
          background:
            "radial-gradient(circle at top left, rgba(15,23,42,1), rgba(15,23,42,0.9))",
          color: "#e5f0ff",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: "0 8px 22px rgba(15,23,42,0.95)",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 11,
            opacity: 0.7,
            textTransform: "uppercase",
            letterSpacing: 0.08,
          }}
        >
          {label}
        </span>
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          {current?.label ?? "—"}
        </span>
        <span style={{ fontSize: 11, opacity: 0.9 }}>▾</span>
      </button>

      {open && !disabled && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: minWidth,
            borderRadius: 12,
            border: "1px solid rgba(30,64,175,0.8)",
            background:
              "radial-gradient(circle at top left, #020617 0, #020617 40%, #030712 100%)",
            boxShadow: "0 18px 40px rgba(15,23,42,0.95)",
            padding: 6,
            zIndex: 50,
          }}
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "7px 9px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 12,
                  cursor: "pointer",
                  background: active
                    ? "linear-gradient(135deg, rgba(59,130,246,1), rgba(37,99,235,1))"
                    : "transparent",
                  color: active ? "#e5f0ff" : "#cbd5f5",
                  marginBottom: 2,
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ----------------------------- Stage picker (pill) ---------------------------- */

const StagePicker: React.FC<{
  value: StageId;
  onChange: (next: StageId) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const current = STAGES.find((s) => s.id === value);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "7px 14px",
          borderRadius: 999,
          border: "1px solid rgba(59,130,246,0.9)",
          background:
            "radial-gradient(circle at top left, rgba(15,23,42,1), rgba(15,23,42,0.9))",
          color: "#e5f0ff",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          boxShadow: "0 8px 22px rgba(15,23,42,0.95)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            opacity: 0.7,
            textTransform: "uppercase",
            letterSpacing: 0.08,
          }}
        >
          Stage
        </span>
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          {current?.label ?? "Choose stage"}
        </span>
        <span style={{ fontSize: 11, opacity: 0.9 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: 180,
            borderRadius: 12,
            border: "1px solid rgba(30,64,175,0.8)",
            background:
              "radial-gradient(circle at top left, #020617 0, #020617 40%, #030712 100%)",
            boxShadow: "0 18px 40px rgba(15,23,42,0.95)",
            padding: 6,
            zIndex: 50,
          }}
        >
          {STAGES.map((stage) => {
            const active = stage.id === value;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => {
                  onChange(stage.id as StageId);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "7px 9px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 12,
                  cursor: "pointer",
                  background: active
                    ? "linear-gradient(135deg, rgba(59,130,246,1), rgba(37,99,235,1))"
                    : "transparent",
                  color: active ? "#e5f0ff" : "#cbd5f5",
                  marginBottom: 2,
                }}
              >
                {stage.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ------------------------- Category picker (Supabase) ------------------------- */

const CategoryPicker: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) console.error(userError);
        if (!user) {
          setErrorMsg("Sign in to manage categories");
          setLoading(false);
          return;
        }
        setUserId(user.id);

        const { data: cats, error: catsError } = await supabase
          .from("project_categories")
          .select("*")
          .order("name", { ascending: true });

        if (catsError) {
          console.error(catsError);
          setErrorMsg("Could not load categories");
          setLoading(false);
          return;
        }

        setCategories((cats || []) as ProjectCategory[]);

        const { data: project, error: projError } = await supabase
          .from("projects")
          .select("category_id")
          .eq("id", projectId)
          .single();

        if (projError) console.error(projError);

        setSelectedCategoryId(project?.category_id || "");
        setLoading(false);
      } catch (err) {
        console.error(err);
        setErrorMsg("Unexpected error loading categories");
        setLoading(false);
      }
    };
    void init();
  }, [projectId]);

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    if (!userId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const { error } = await supabase
        .from("projects")
        .update({ category_id: categoryId || null })
        .eq("id", projectId);
      if (error) {
        console.error(error);
        setErrorMsg("Failed to update category");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to update category");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("project_categories")
        .insert({
          user_id: userId,
          name: newCategoryName.trim(),
          is_default: false,
        })
        .select("*")
        .single();

      if (error || !data) {
        console.error(error);
        setErrorMsg("Failed to create category");
        setLoading(false);
        return;
      }

      const newCat = data as ProjectCategory;
      const { error: updateError } = await supabase
        .from("projects")
        .update({ category_id: newCat.id })
        .eq("id", projectId);
      if (updateError) {
        console.error(updateError);
        setErrorMsg("Category created but not linked to project");
        setLoading(false);
        return;
      }

      setCategories((prev) => [...prev, newCat]);
      setSelectedCategoryId(newCat.id);
      setNewCategoryName("");
      setIsAdding(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        alignItems: "flex-end",
        minWidth: 260,
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <PillSelect
          label="Category"
          value={selectedCategoryId}
          disabled={loading || !userId}
          onChange={handleCategoryChange}
          options={[
            { value: "", label: "No category" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
          minWidth={210}
        />
        <button
          type="button"
          onClick={() => setIsAdding((prev) => !prev)}
          disabled={loading || !userId}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.9)",
            background: "rgba(15,23,42,0.95)",
            color: "white",
            fontSize: 11,
            cursor: "pointer",
            whiteSpace: "nowrap",
            opacity: loading || !userId ? 0.6 : 1,
          }}
        >
          + Add
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAddCategory}
          style={{ display: "flex", gap: 6, marginTop: 4 }}
        >
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            style={{
              borderRadius: 999,
              border: "1px solid rgba(51,65,85,0.9)",
              padding: "6px 9px",
              fontSize: 12,
              background: "rgba(15,23,42,0.95)",
              color: "white",
              outline: "none",
              minWidth: 160,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(59,130,246,0.9)",
              background:
                "linear-gradient(135deg, rgba(59,130,246,1), rgba(37,99,235,1))",
              color: "white",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Save
          </button>
        </form>
      )}

      {errorMsg && (
        <div style={{ fontSize: 10, color: "#fca5a5", marginTop: 2 }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
};

/* ------------------------------ PAGE START ------------------------------ */

export default function SiteDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { sites, updateSiteStage, updateSiteContact, addNote } = useProjects();

  const site = useMemo(() => sites.find((s) => s.id === id), [sites, id]);

  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // CONTACTS – Owner/Primary
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [postalAddress, setPostalAddress] = useState("");

  // CONTACTS – Solicitor (local-only for now)
  const [solicitorName, setSolicitorName] = useState("");
  const [solicitorEmail, setSolicitorEmail] = useState("");
  const [solicitorPhone, setSolicitorPhone] = useState("");
  const [solicitorCompany, setSolicitorCompany] = useState("");
  const [solicitorAddress, setSolicitorAddress] = useState("");

  // Entire Contacts tab edit lock
  const [isEditingContacts, setIsEditingContacts] = useState(false);
  const contactsSnapshotRef = useRef<null | {
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    contactCompany: string;
    postalAddress: string;
    solicitorName: string;
    solicitorEmail: string;
    solicitorPhone: string;
    solicitorCompany: string;
    solicitorAddress: string;
  }>(null);

  // notes
  const [newNote, setNewNote] = useState("");

  // documents
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  // photos
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  // site details
  const [siteSize, setSiteSize] = useState("");
  const [siteSizeUnit, setSiteSizeUnit] = useState<
    "sqft" | "sqm" | "acres" | "hectares"
  >("sqft");
  const [titleNumber, setTitleNumber] = useState("");

  // offers
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerDate, setOfferDate] = useState("");
  const [offerStatus, setOfferStatus] = useState<OfferStatus>("sent");
  const [offerNote, setOfferNote] = useState("");

  // reminders
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [reminderText, setReminderText] = useState("");
  const [reminderDueDate, setReminderDueDate] = useState("");

  // linked (placeholders)
  const [linkedParcels, setLinkedParcels] = useState<string[]>([]);
  const [linkedSites, setLinkedSites] = useState<string[]>([]);
  const [newParcelId, setNewParcelId] = useState("");
  const [newLinkedSiteLabel, setNewLinkedSiteLabel] = useState("");

  // GIS toggles (placeholder)
  const [gisLayers, setGisLayers] = useState<Record<string, boolean>>({
    flood_risk: false,
    land_registry: false,
    greenbelt: false,
    constraints: false,
    utilities: false,
    lidar: false,
    soil: false,
  });

  // PPD state
  const [ppdStatus, setPpdStatus] = useState<PpdStatus>("idle");
  const [ppdSales, setPpdSales] = useState<PpdRow[]>([]);

  useEffect(() => {
    if (!site) return;
    setContactName(site.contactName ?? "");
    setContactEmail(site.contactEmail ?? "");
    setContactPhone(site.contactPhone ?? "");
    setContactCompany(site.contactCompany ?? "");
    // postal + solicitor kept local for now
  }, [site]);

  useEffect(() => {
    if (!site) return;
    if (activeTab !== "ppd") return;
    if (!site.lat || !site.lng) return;

    const fetchPpd = async () => {
      setPpdStatus("loading");
      setPpdSales([]);

      try {
        const params = new URLSearchParams({
          lat: String(site.lat),
          lng: String(site.lng),
          radius_m: "200",
          limit: "8",
        });

        const res = await fetch(`/api/ppd/near?${params.toString()}`);
        if (!res.ok) {
          console.error("PPD near fetch failed", await res.text());
          setPpdStatus("error");
          return;
        }
        const json = await res.json();
        const sales: PpdRow[] = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
          ? json.data
          : [];

        if (sales.length === 0) {
          setPpdStatus("no-results");
        } else {
          setPpdStatus("ok");
          setPpdSales(sales);
        }
      } catch (err) {
        console.error("PPD near fetch threw", err);
        setPpdStatus("error");
      }
    };

    void fetchPpd();
  }, [activeTab, site]);

  if (!site) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "white",
          fontFamily,
          padding: 24,
        }}
      >
        <p style={{ fontSize: 14, marginBottom: 12 }}>
          Site not found. This can happen if you refresh and the in-memory
          projects state resets.
        </p>
        <Link
          href="/projects"
          style={{
            color: "#60a5fa",
            textDecoration: "underline",
            fontSize: 14,
          }}
        >
          ← Back to Projects
        </Link>
      </div>
    );
  }

  /* -------------------------- CONTACTS edit flow -------------------------- */

  const startEditContacts = () => {
    contactsSnapshotRef.current = {
      contactName,
      contactEmail,
      contactPhone,
      contactCompany,
      postalAddress,
      solicitorName,
      solicitorEmail,
      solicitorPhone,
      solicitorCompany,
      solicitorAddress,
    };
    setIsEditingContacts(true);
  };

  const cancelEditContacts = () => {
    const s = contactsSnapshotRef.current;
    if (s) {
      setContactName(s.contactName);
      setContactEmail(s.contactEmail);
      setContactPhone(s.contactPhone);
      setContactCompany(s.contactCompany);
      setPostalAddress(s.postalAddress);
      setSolicitorName(s.solicitorName);
      setSolicitorEmail(s.solicitorEmail);
      setSolicitorPhone(s.solicitorPhone);
      setSolicitorCompany(s.solicitorCompany);
      setSolicitorAddress(s.solicitorAddress);
    }
    setIsEditingContacts(false);
  };

  const saveContacts = () => {
    updateSiteContact(site.id, {
      name: contactName || undefined,
      email: contactEmail || undefined,
      phone: contactPhone || undefined,
      company: contactCompany || undefined,
    });
    // (solicitor + postal kept local for now)
    setIsEditingContacts(false);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNote(site.id, newNote);
    setNewNote("");
  };

  const handleDocumentUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const label = window.prompt("Name this document", file.name) ?? file.name;
    const url = URL.createObjectURL(file);

    const newDoc: DocumentItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      fileName: file.name,
      label: label.trim() || file.name,
      url,
      createdAt: new Date().toISOString(),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    e.target.value = "";
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newPhoto: PhotoItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      fileName: file.name,
      url,
      isHero: photos.length === 0,
    };
    setPhotos((prev) => [newPhoto, ...prev]);
    e.target.value = "";
  };

  const setHeroPhoto = (id: string) => {
    setPhotos((prev) => prev.map((p) => ({ ...p, isHero: p.id === id })));
  };

  const handleAddOffer = () => {
    if (!offerAmount.trim()) return;
    const newOffer: OfferItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      amount: offerAmount.trim(),
      date: offerDate || new Date().toISOString().slice(0, 10),
      status: offerStatus,
      note: offerNote.trim(),
    };
    setOffers((prev) => [newOffer, ...prev]);
    setOfferAmount("");
    setOfferDate("");
    setOfferNote("");
    setOfferStatus("sent");
  };

  const handleAddReminder = () => {
    if (!reminderText.trim()) return;
    const newReminder: ReminderItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: reminderText.trim(),
      dueDate: reminderDueDate || "",
    };
    setReminders((prev) => [newReminder, ...prev]);
    setReminderText("");
    setReminderDueDate("");
  };

  const heroPhoto = photos.find((p) => p.isHero);

  const toggleGisLayer = (key: string) => {
    setGisLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* ------------------------------ TAB RENDER ------------------------------ */

  const renderOverview = () => {
    const recentNotes = [...site.notes].slice(-3).reverse();

    return (
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.1fr)", gap: 16 }}>
        {/* Left: hero + meta + owner summary + notes */}
        <section
          style={{
            borderRadius: 18,
            border: "1px solid rgba(30,64,175,0.7)",
            background:
              "radial-gradient(circle at top left, #020617 0, #020617 45%, #030712 100%)",
            padding: 18,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
            gap: 16,
          }}
        >
          {/* Address + meta */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              {site.address}
            </div>
            <div style={{ fontSize: 11.5, opacity: 0.8 }}>
              {site.lat.toFixed(5)}, {site.lng.toFixed(5)}
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>
              Saved{" "}
              {new Date(site.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>

            {titleNumber && (
              <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8 }}>
                Land Registry title: <span style={{ fontWeight: 600 }}>{titleNumber}</span>
              </div>
            )}

            {/* Owner snapshot */}
            <div
              style={{
                marginTop: 14,
                borderRadius: 14,
                border: "1px solid rgba(51,65,85,0.9)",
                padding: 12,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Owner / primary contact
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                {site.contactName || "—"}
                {site.contactCompany ? ` · ${site.contactCompany}` : ""}
              </div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                {site.contactEmail ? (
                  <a href={`mailto:${site.contactEmail}`} style={{ color: "#93c5fd" }}>
                    {site.contactEmail}
                  </a>
                ) : (
                  "—"
                )}
                {site.contactPhone ? ` · ${site.contactPhone}` : ""}
              </div>
            </div>
          </div>

          {/* Hero photo / stage */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
            {heroPhoto ? (
              <div
                style={{
                  width: "100%",
                  borderRadius: 14,
                  border: "1px solid rgba(30,64,175,0.8)",
                  overflow: "hidden",
                  maxHeight: 160,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroPhoto.url}
                  alt={heroPhoto.fileName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  minHeight: 80,
                  borderRadius: 14,
                  border: "1px dashed rgba(51,65,85,0.9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  opacity: 0.7,
                }}
              >
                No hero photo yet. Add one on the Photos tab.
              </div>
            )}

            <div style={{ fontSize: 11, opacity: 0.75, textAlign: "right" }}>
              Current stage:{" "}
              <span style={{ fontWeight: 600 }}>
                {STAGES.find((s) => s.id === site.stage)?.label ?? "Uncategorised"}
              </span>
            </div>
          </div>

          {/* Recent notes */}
          <div
            style={{
              gridColumn: "1 / -1",
              borderRadius: 14,
              border: "1px solid rgba(51,65,85,0.9)",
              padding: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Recent notes</h3>
              <Link href="#" onClick={(e) => { e.preventDefault(); setActiveTab("notes"); }} style={{ fontSize: 12, color: "#93c5fd" }}>
                View all →
              </Link>
            </div>

            {recentNotes.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                No notes yet. Add notes on the Notes tab.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {recentNotes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      borderRadius: 10,
                      border: "1px solid rgba(51,65,85,0.95)",
                      background:
                        "radial-gradient(circle at top left, #020617 0, #020617 45%, #030712 100%)",
                      padding: 10,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4 }}>
                      {new Date(note.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{note.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right: quick stats */}
        <section
          style={{
            borderRadius: 16,
            border: "1px solid rgba(30,64,175,0.7)",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Quick stats</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
            <li style={{ opacity: 0.85 }}>
              Site size:{" "}
              <strong>
                {siteSize
                  ? `${siteSize} ${siteSizeUnit === "sqft" ? "sq ft" : siteSizeUnit === "sqm" ? "sq m" : siteSizeUnit}`
                  : "Not set"}
              </strong>
            </li>
            <li style={{ opacity: 0.85 }}>Offers recorded: <strong>{offers.length}</strong></li>
            <li style={{ opacity: 0.85 }}>Notes logged: <strong>{site.notes.length}</strong></li>
            <li style={{ opacity: 0.85 }}>Reminders: <strong>{reminders.length}</strong></li>
          </ul>
        </section>
      </div>
    );
  };

  const renderContacts = () => (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)", gap: 18 }}>
      {/* Controls bar */}
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 8 }}>
        {!isEditingContacts ? (
          <button
            type="button"
            onClick={startEditContacts}
            style={{
              padding: "7px 14px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.9)",
              background: "rgba(15,23,42,0.95)",
              color: "white",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Edit details
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={cancelEditContacts}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.9)",
                background: "rgba(15,23,42,0.95)",
                color: "white",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveContacts}
              style={{
                padding: "7px 16px",
                borderRadius: 999,
                border: "1px solid rgba(59,130,246,0.9)",
                background:
                  "linear-gradient(135deg, rgba(59,130,246,1), rgba(37,99,235,1))",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 10px 25px rgba(37,99,235,0.7)",
              }}
            >
              Save
            </button>
          </>
        )}
      </div>

      {/* Owner / primary contact */}
      <section
        style={{
          borderRadius: 16,
          border: "1px solid rgba(30,64,175,0.7)",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
          padding: 16,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          Owner / primary contact
        </h2>
        <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 12 }}>
          Store contact information for the site owner or main decision maker.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <label style={{ fontSize: 11, opacity: 0.8, display: "block", marginBottom: 4 }}>
              Name
            </label>
            <input
              disabled={!isEditingContacts}
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Owner or primary contact"
              style={inputStyle(!isEditingContacts)}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <label style={{ fontSize: 11, opacity: 0.8, display: "block", marginBottom: 4 }}>
              Company
            </label>
            <input
              disabled={!isEditingContacts}
              type="text"
              value={contactCompany}
              onChange={(e) => setContactCompany(e.target.value)}
              placeholder="Company / agency"
              style={inputStyle(!isEditingContacts)}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <label style={{ fontSize: 11, opacity: 0.8, display: "block", marginBottom: 4 }}>
              Email
            </label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                disabled={!isEditingContacts}
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="name@example.com"
                style={{ ...inputStyle(!isEditingContacts), flex: 1 }}
              />
              <a
                href={contactEmail ? `mailto:${contactEmail}` : "mailto:"}
                style={pillButtonSecondary}
              >
                Email
              </a>
            </div>
          </div>

          <div style={{ minWidth: 0 }}>
            <label style={{ fontSize: 11, opacity: 0.8, display: "block", marginBottom: 4 }}>
              Phone
            </label>
            <input
              disabled={!isEditingContacts}
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+44…"
              style={inputStyle(!isEditingContacts)}
            />
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, opacity: 0.8, display: "block", marginBottom: 4 }}>
            Postal address (may differ from site address)
          </label>
          <textarea
            disabled={!isEditingContacts}
            value={postalAddress}
            onChange={(e) => setPostalAddress(e.target.value)}
            rows={3}
            placeholder="Postal address for correspondence"
            style={textareaStyle(!isEditingContacts)}
          />
        </div>
      </section>

      {/* Solicitor */}
      <section
        style={{
          borderRadius: 16,
          border: "1px solid rgba(30,64,175,0.7)",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
          padding: 16,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          Solicitor contact
        </h2>
        <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 12 }}>
          Details for the solicitor acting on this transaction.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <label style={{ fontSize: 11, opacity: 0.8, display: "block", marginBottom: 4 }}>
              Name
            </label>
            <input
              disabled={!isEditingContacts}
              type="text"
              value={solicitorName}
              onChange={(e) => setSolicitorName(e.target.value)}
              placeholder="Solicitor name"
              style={inputStyle(!isEditingContacts)}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <label style={{ fontSize: 11, opacity: 0.8, display: "block", marginBottom: 4 }}>
              Firm
            </label>
            <input
              disabled={!isEditingContacts}
              type="text"
              value={solicitorCompany}
              onChange={(e) => setSolicitorCompany(e.target.value)}
              placeholder="Firm / practice"
              style={inputStyle(!isEditingContacts)}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <label style={{ fontSize: 11, opacity: 0.8, display: "block", marginBottom: 4 }}>
              Email
            </label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                disabled={!isEditingContacts}
                type="email"
                value={solicitorEmail}
                onChange={(e) => setSolicitorEmail(e.target.value)}
                placeholder="solicitor@example.com"
                style={{ ...inputStyle(!isEditingContacts), flex: 1 }}
              />
              <a
                href={solicitorEmail ? `mailto:${solicitorEmail}` : "mailto:"}
                style={pillButtonSecondary}
              >
                Email
              </a>
            </div>
          </div>

          <div style={{ minWidth: 0 }}>
            <label style={{ fontSize: 11, opacity: 0.8, display: "block", marginBottom: 4 }}>
              Phone
            </label>
            <input
              disabled={!isEditingContacts}
              type="tel"
              value={solicitorPhone}
              onChange={(e) => setSolicitorPhone(e.target.value)}
              placeholder="+44…"
              style={inputStyle(!isEditingContacts)}
            />
          </div>
        </div>

        <label style={{ fontSize: 11, opacity: 0.8, display: "block", marginBottom: 4 }}>
          Address
        </label>
        <textarea
          disabled={!isEditingContacts}
          value={solicitorAddress}
          onChange={(e) => setSolicitorAddress(e.target.value)}
          rows={3}
          placeholder="Solicitor's postal address"
          style={textareaStyle(!isEditingContacts)}
        />
      </section>
    </div>
  );

  const renderNotes = () => (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)", gap: 18 }}>
      <section
        style={{
          borderRadius: 16,
          border: "1px solid rgba(30,64,175,0.7)",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
          padding: 16,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          Notes & history
        </h2>
        <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
          Log call notes, letters sent, and key decisions.
        </p>

        <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            placeholder="Add a quick note about your latest interaction…"
            style={textareaStyle(false)}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button type="button" onClick={handleAddNote} style={pillButtonPrimary}>
              Add note
            </button>
            <span style={{ fontSize: 11, opacity: 0.65 }}>
              {site.notes.length} note{site.notes.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {site.notes.length === 0 ? (
            <div
              style={{
                fontSize: 12,
                opacity: 0.75,
                borderRadius: 10,
                border: "1px dashed rgba(51,65,85,0.9)",
                padding: 10,
              }}
            >
              No notes yet. Use this area to build up a history of letters,
              calls, and decisions for this opportunity.
            </div>
          ) : (
            site.notes.map((note) => (
              <div
                key={note.id}
                style={{
                  borderRadius: 10,
                  border: "1px solid rgba(51,65,85,0.95)",
                  background:
                    "radial-gradient(circle at top left, #020617 0, #020617 45%, #030712 100%)",
                  padding: 10,
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4 }}>
                  {new Date(note.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
                <div style={{ fontSize: 12.5, whiteSpace: "pre-wrap" }}>
                  {note.text}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section
        style={{
          borderRadius: 16,
          border: "1px dashed rgba(30,64,175,0.7)",
          background: "#020617",
          padding: 16,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          Timeline (placeholder)
        </h2>
        <p style={{ fontSize: 12, opacity: 0.75 }}>
          This panel can later show a visual timeline of key events (letters
          sent, stage changes, offers, etc.), auto-built from notes and
          activity.
        </p>
      </section>
    </div>
  );

  const renderDocuments = () => (
    <section
      style={{
        borderRadius: 16,
        border: "1px solid rgba(30,64,175,0.7)",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
        padding: 16,
      }}
    >
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
        Documents
      </h2>
      <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
        Upload and label key documents for this opportunity (title plans,
        letters, agreements, etc.).
      </p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <input type="file" onChange={handleDocumentUpload} style={{ fontSize: 12 }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
        {documents.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              opacity: 0.75,
              borderRadius: 10,
              border: "1px dashed rgba(51,65,85,0.9)",
              padding: 10,
            }}
          >
            No documents uploaded yet.
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              style={{
                borderRadius: 10,
                border: "1px solid rgba(51,65,85,0.95)",
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.75 }}>
                Upload: {doc.fileName} ·{" "}
                {new Date(doc.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto auto auto", gap: 8, alignItems: "center" }}>
                <input
                  type="text"
                  value={doc.label}
                  onChange={(e) =>
                    setDocuments((prev) =>
                      prev.map((d) => (d.id === doc.id ? { ...d, label: e.target.value } : d))
                    )
                  }
                  placeholder="Label (e.g. Title plan, Heads of terms)"
                  style={inputStyle(false)}
                />
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  style={pillButtonSecondary}
                >
                  Open
                </a>
                <a
                  href={doc.url}
                  download={doc.label || doc.fileName}
                  style={pillButtonSecondary}
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() =>
                    setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
                  }
                  style={pillButtonSecondary}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );

  const renderPhotos = () => (
    <section
      style={{
        borderRadius: 16,
        border: "1px solid rgba(30,64,175,0.7)",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
        padding: 16,
      }}
    >
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
        Photos
      </h2>
      <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
        Upload photos and choose a hero image for the site dashboard.
      </p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ fontSize: 12 }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        {photos.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              opacity: 0.75,
              borderRadius: 10,
              border: "1px dashed rgba(51,65,85,0.9)",
              padding: 10,
            }}
          >
            No photos uploaded yet.
          </div>
        ) : (
          photos.map((photo) => (
            <div
              key={photo.id}
              style={{
                borderRadius: 12,
                border: "1px solid rgba(51,65,85,0.95)",
                overflow: "hidden",
                background: "#020617",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.fileName}
                style={{ width: "100%", height: 140, objectFit: "cover" }}
              />
              <div
                style={{
                  padding: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {photo.fileName}
                </span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setHeroPhoto(photo.id)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 999,
                      border: photo.isHero
                        ? "1px solid rgba(59,130,246,0.9)"
                        : "1px solid rgba(148,163,184,0.9)",
                      background: photo.isHero
                        ? "linear-gradient(135deg, rgba(59,130,246,1), rgba(37,99,235,1))"
                        : "rgba(15,23,42,0.95)",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    {photo.isHero ? "Hero photo" : "Make hero"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
                    }
                    style={{
                      padding: "4px 8px",
                      borderRadius: 999,
                      border: "1px solid rgba(148,163,184,0.9)",
                      background: "rgba(15,23,42,0.95)",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );

  const renderSiteDetails = () => (
    <section
      style={{
        borderRadius: 16,
        border: "1px solid rgba(30,64,175,0.7)",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
        padding: 16,
      }}
    >
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
        Site details & metrics
      </h2>
      <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 12 }}>
        Capture headline site metrics and identifiers.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <label style={{ fontSize: 11, opacity: 0.8, display: "block", marginBottom: 4 }}>
            Total site size
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="number"
              value={siteSize}
              onChange={(e) => setSiteSize(e.target.value)}
              placeholder="e.g. 12000"
              style={{ ...inputStyle(false), flex: 1 }}
            />
            <PillSelect
              label="Units"
              value={siteSizeUnit}
              onChange={(v) => setSiteSizeUnit(v as any)}
              options={[
                { value: "sqft", label: "sq ft" },
                { value: "sqm", label: "sq m" },
                { value: "acres", label: "acres" },
                { value: "hectares", label: "hectares" },
              ]}
              minWidth={130}
            />
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <label style={{ fontSize: 11, opacity: 0.8, display: "block", marginBottom: 4 }}>
            Land Registry title number
          </label>
          <input
            type="text"
            value={titleNumber}
            onChange={(e) => setTitleNumber(e.target.value)}
            placeholder="e.g. SY123456"
            style={inputStyle(false)}
          />
        </div>
      </div>

      <div
        style={{
          borderRadius: 12,
          border: "1px dashed rgba(51,65,85,0.9)",
          padding: 10,
          fontSize: 12,
          opacity: 0.8,
        }}
      >
        Placeholder for future derived metrics: plot ratio, estimated units,
        density bands, etc.
      </div>
    </section>
  );

  const renderOffers = () => (
    <section
      style={{
        borderRadius: 16,
        border: "1px solid rgba(30,64,175,0.7)",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
        padding: 16,
      }}
    >
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
        Offers
      </h2>
      <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 12 }}>
        Track offers sent to the owner, their status, and any notes.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) auto",
          gap: 8,
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <input
          type="text"
          value={offerAmount}
          onChange={(e) => setOfferAmount(e.target.value)}
          placeholder="Offer amount (e.g. £450,000)"
          style={inputStyle(false)}
        />
        <input
          type="date"
          value={offerDate}
          onChange={(e) => setOfferDate(e.target.value)}
          style={inputStyle(false)}
        />
        <PillSelect
          label="Status"
          value={offerStatus}
          onChange={(v) => setOfferStatus(v as OfferStatus)}
          options={[
            { value: "sent", label: "Sent" },
            { value: "pending", label: "Pending" },
            { value: "accepted", label: "Accepted" },
            { value: "rejected", label: "Rejected" },
          ]}
          minWidth={160}
        />
        <button type="button" onClick={handleAddOffer} style={pillButtonPrimary}>
          Add
        </button>
      </div>

      <textarea
        value={offerNote}
        onChange={(e) => setOfferNote(e.target.value)}
        rows={2}
        placeholder="Optional note about this offer (terms, conditions, etc.)"
        style={{ ...textareaStyle(false), marginBottom: 12 }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
        {offers.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              opacity: 0.75,
              borderRadius: 10,
              border: "1px dashed rgba(51,65,85,0.9)",
              padding: 10,
            }}
          >
            No offers recorded yet.
          </div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              style={{
                borderRadius: 10,
                border: "1px solid rgba(51,65,85,0.95)",
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                fontSize: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{offer.amount}</strong>{" "}
                  <span style={{ opacity: 0.8 }}>
                    ·{" "}
                    {offer.date
                      ? new Date(offer.date).toLocaleDateString(undefined, { dateStyle: "medium" })
                      : "Date not set"}
                  </span>
                </div>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 999,
                    border: "1px solid rgba(51,65,85,0.9)",
                    fontSize: 11,
                    textTransform: "capitalize",
                    opacity: 0.9,
                  }}
                >
                  {offer.status}
                </span>
              </div>
              {offer.note && <div style={{ opacity: 0.85 }}>{offer.note}</div>}
            </div>
          ))
        )}
      </div>
    </section>
  );

  const renderLinked = () => (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }}>
      {/* Parcels */}
      <section
        style={{
          borderRadius: 16,
          border: "1px solid rgba(30,64,175,0.7)",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
          padding: 16,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          Linked Land Registry parcels
        </h2>
        <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
          Manually link title numbers or parcel IDs that form part of this
          opportunity.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            type="text"
            value={newParcelId}
            onChange={(e) => setNewParcelId(e.target.value)}
            placeholder="Title number / parcel ID"
            style={{ ...inputStyle(false), flex: 1 }}
          />
          <button
            type="button"
            onClick={() => {
              if (!newParcelId.trim()) return;
              setLinkedParcels((prev) => [newParcelId.trim(), ...prev]);
              setNewParcelId("");
            }}
            style={pillButtonPrimary}
          >
            Add
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {linkedParcels.length === 0 ? (
            <div
              style={{
                fontSize: 12,
                opacity: 0.75,
                borderRadius: 10,
                border: "1px dashed rgba(51,65,85,0.9)",
                padding: 10,
              }}
            >
              No parcels linked yet.
            </div>
          ) : (
            linkedParcels.map((p) => (
              <div
                key={p}
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(51,65,85,0.9)",
                  padding: "6px 10px",
                  fontSize: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{p}</span>
                <button
                  type="button"
                  onClick={() => setLinkedParcels((prev) => prev.filter((x) => x !== p))}
                  style={pillButtonSecondary}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Linked sites */}
      <section
        style={{
          borderRadius: 16,
          border: "1px solid rgba(30,64,175,0.7)",
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
          padding: 16,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          Linked sites in pipeline
        </h2>
        <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
          Link other sites from your pipeline to represent multi-parcel
          opportunities.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            type="text"
            value={newLinkedSiteLabel}
            onChange={(e) => setNewLinkedSiteLabel(e.target.value)}
            placeholder="Linked site label / reference"
            style={{ ...inputStyle(false), flex: 1 }}
          />
          <button
            type="button"
            onClick={() => {
              if (!newLinkedSiteLabel.trim()) return;
              setLinkedSites((prev) => [newLinkedSiteLabel.trim(), ...prev]);
              setNewLinkedSiteLabel("");
            }}
            style={pillButtonPrimary}
          >
            Add
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {linkedSites.length === 0 ? (
            <div
              style={{
                fontSize: 12,
                opacity: 0.75,
                borderRadius: 10,
                border: "1px dashed rgba(51,65,85,0.9)",
                padding: 10,
              }}
            >
              No linked sites yet.
            </div>
          ) : (
            linkedSites.map((label) => (
              <div
                key={label}
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(51,65,85,0.9)",
                  padding: "6px 10px",
                  fontSize: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => setLinkedSites((prev) => prev.filter((x) => x !== label))}
                  style={pillButtonSecondary}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );

  const renderPlanning = () => (
    <section
      style={{
        borderRadius: 16,
        border: "1px solid rgba(30,64,175,0.7)",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
        padding: 16,
      }}
    >
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
        Planning history (placeholder)
      </h2>
      <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 12 }}>
        In future this tab will pull planning applications for this property,
        show history, and drive AI tools like auto-summarised decisions and
        approval likelihood.
      </p>

      <div
        style={{
          borderRadius: 12,
          border: "1px dashed rgba(51,65,85,0.9)",
          padding: 12,
          fontSize: 12,
        }}
      >
        <p style={{ marginBottom: 8, opacity: 0.8 }}>
          Example features to add here:
        </p>
        <ul
          style={{
            margin: 0,
            paddingLeft: 16,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <li>Fetch planning history from local authority feeds / APIs</li>
          <li>Auto-summarise long committee reports</li>
          <li>Predict likelihood of planning approval</li>
          <li>Generate site potential scoring</li>
          <li>Highlight similar scheme precedents nearby</li>
        </ul>
      </div>
    </section>
  );

  const renderPPD = () => (
    <section
      style={{
        borderRadius: 16,
        border: "1px solid rgba(30,64,175,0.7)",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
        padding: 16,
      }}
    >
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
        PPD – nearby sold history
      </h2>
      <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
        Land Registry Price Paid Data within ~200m of this site.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
        {ppdStatus === "idle" || ppdStatus === "loading" ? (
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {ppdStatus === "idle" ? "Loading nearby sales…" : "Loading nearby sales…"}
          </div>
        ) : null}

        {ppdStatus === "error" && (
          <div style={{ fontSize: 12, color: "#fca5a5" }}>
            Could not load nearby sales.
          </div>
        )}

        {ppdStatus === "no-results" && (
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            No recent nearby sales found for this location.
          </div>
        )}

        {ppdStatus === "ok" &&
          ppdSales.map((sale) => {
            const tenureText = formatTenure(sale.tenure);
            const typeText = formatPropertyType(sale.property_type);
            const description = [tenureText, typeText].filter(Boolean).join(" ");

            return (
              <div
                key={sale.transaction_id}
                style={{
                  borderRadius: 12,
                  border: "1px solid rgba(51,65,85,0.95)",
                  padding: 10,
                  background:
                    "radial-gradient(circle at top left, #020617 0, #020617 45%, #030712 100%)",
                  boxShadow: "0 12px 25px rgba(15,23,42,0.7)",
                  fontSize: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    £{sale.price.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>{sale.date}</div>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                  {sale.paon && <span>{sale.paon} </span>}
                  {sale.saon && <span>{sale.saon} </span>}
                  {sale.street && <span>{sale.street.toUpperCase()}</span>}
                </div>
                <div style={{ fontSize: 11.5, opacity: 0.85 }}>
                  {sale.postcode} · {(sale.town || sale.locality || "").toUpperCase().trim()}
                </div>
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 3 }}>
                  {description || "Property type unknown"}
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );

  const renderGis = () => (
    <section
      style={{
        borderRadius: 16,
        border: "1px solid rgba(30,64,175,0.7)",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
        padding: 16,
      }}
    >
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
        GIS & data layers (placeholder)
      </h2>
      <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
        Configure spatial layers and datasets that will appear on the map for
        this opportunity.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
        {[
          ["flood_risk", "Flood risk"],
          ["land_registry", "Land Registry polygons"],
          ["greenbelt", "Greenbelt / AONB"],
          ["constraints", "Constraints"],
          ["utilities", "Utilities"],
          ["lidar", "LIDAR elevation"],
          ["soil", "Soil quality"],
        ].map(([key, label]) => (
          <label
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 6,
              borderRadius: 10,
              border: "1px solid rgba(51,65,85,0.9)",
              background: "rgba(15,23,42,0.95)",
            }}
          >
            <input
              type="checkbox"
              checked={gisLayers[key]}
              onChange={() => toggleGisLayer(key)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </section>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "contacts":
        return renderContacts();
      case "notes":
        return renderNotes();
      case "documents":
        return renderDocuments();
      case "photos":
        return renderPhotos();
      case "site":
        return renderSiteDetails();
      case "offers":
        return renderOffers();
      case "linked":
        return renderLinked();
      case "planning":
        return renderPlanning();
      case "ppd":
        return renderPPD();
      case "gis":
        return renderGis();
      default:
        return null;
    }
  };

  /* --------------------------------- UI --------------------------------- */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        fontFamily,
      }}
    >
      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* LEFT SIDEBAR */}
        <aside
          style={{
            width: 240,
            borderRight: "1px solid rgba(15,23,42,1)",
            padding: 18,
            paddingTop: 20,
            background:
              "radial-gradient(circle at top, #020617 0, #020617 55%, #020617 100%)",
            boxShadow: "4px 0 30px rgba(15,23,42,0.9)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: "5px 12px",
              borderRadius: 999,
              border: "1px solid rgba(51,65,85,0.9)",
              background: "rgba(15,23,42,0.95)",
              color: "white",
              fontSize: 11,
              cursor: "pointer",
              alignSelf: "flex-start",
            }}
          >
            ← Back
          </button>

          <div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
              Site dashboard
            </div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Manage this opportunity end-to-end.
            </div>
          </div>

          <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 4 }}>
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabId)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "7px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(15,23,42,1)",
                    background: isActive
                      ? "linear-gradient(135deg, rgba(37,99,235,1), rgba(30,64,175,1))"
                      : "transparent",
                    color: isActive ? "#e5f0ff" : "#cbd5f5",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1 }} />

          <Link
            href="/projects"
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid rgba(51,65,85,0.9)",
              fontSize: 12,
              textDecoration: "none",
              color: "#e5f0ff",
              background: "rgba(15,23,42,0.95)",
              whiteSpace: "nowrap",
              alignSelf: "flex-start",
            }}
          >
            View pipeline →
          </Link>
        </aside>

        {/* MAIN CONTENT */}
        <main
          style={{
            flex: 1,
            padding: 24,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* Top row: category + stage pickers */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <CategoryPicker projectId={site.id} />
            <StagePicker
              value={site.stage as StageId}
              onChange={(next) => updateSiteStage(site.id, next)}
            />
          </div>

          {/* Tab content */}
          {renderTabContent()}

          {/* AI tools button */}
          <button
            type="button"
            style={{
              position: "fixed",
              right: 28,
              bottom: 24,
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid rgba(59,130,246,0.9)",
              background:
                "linear-gradient(135deg, rgba(59,130,246,1), rgba(37,99,235,1))",
              color: "white",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 15px 35px rgba(37,99,235,0.75)",
            }}
          >
            AI tools (coming soon)
          </button>
        </main>
      </div>
    </div>
  );
}

/* ------------------------------- styles ------------------------------- */

const inputStyle = (disabled: boolean): React.CSSProperties => ({
  width: "100%",
  borderRadius: 6,
  border: "1px solid rgba(51,65,85,0.9)",
  padding: "7px 9px",
  fontSize: 12,
  background: disabled ? "rgba(15,23,42,0.6)" : "rgba(15,23,42,0.95)",
  color: "#fff",
  outline: "none",
  minWidth: 0,
  opacity: disabled ? 0.9 : 1,
});

const textareaStyle = (disabled: boolean): React.CSSProperties => ({
  width: "100%",
  borderRadius: 8,
  border: "1px solid rgba(51,65,85,0.9)",
  padding: "8px 10px",
  fontSize: 12,
  background: disabled ? "rgba(15,23,42,0.6)" : "rgba(15,23,42,0.95)",
  color: "white",
  outline: "none",
  resize: "vertical",
  minWidth: 0,
  opacity: disabled ? 0.9 : 1,
});

const pillButtonPrimary: React.CSSProperties = {
  padding: "7px 12px",
  borderRadius: 999,
  border: "1px solid rgba(59,130,246,0.9)",
  background:
    "linear-gradient(135deg, rgba(59,130,246,1), rgba(37,99,235,1))",
  color: "white",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const pillButtonSecondary: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.9)",
  background: "rgba(15,23,42,0.95)",
  color: "white",
  fontSize: 11,
  cursor: "pointer",
  textDecoration: "none",
  whiteSpace: "nowrap",
};
