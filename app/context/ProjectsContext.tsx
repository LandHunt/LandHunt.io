"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
} from "react";

type SiteStage =
  | "uncategorised"
  | "letter_sent"
  | "contact_made"
  | "instructed"
  | "sold";

type Note = {
  id: string;
  text: string;
  createdAt: string;
};

type SiteSizeUnit = "sqft" | "sqm" | "acres" | "hectares";

type OfferStatus = "sent" | "accepted" | "rejected" | "pending";

type Offer = {
  id: string;
  amount: string;       // keep as string for now (“£450,000”, “450k”)
  date: string;         // YYYY-MM-DD
  status: OfferStatus;
  note?: string;
};

type Reminder = {
  id: string;
  text: string;
  dueDate?: string;     // YYYY-MM-DD or empty
};

type Site = {
  id: string;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
  stage: SiteStage;

  // core contact (already used)
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactCompany?: string;

  // extra contact info
  postalAddress?: string;
  solicitorName?: string;
  solicitorEmail?: string;
  solicitorPhone?: string;
  solicitorCompany?: string;
  solicitorAddress?: string;

  // notes
  notes: Note[];

  // site details / metrics
  siteSize?: string;
  siteSizeUnit?: SiteSizeUnit;
  titleNumber?: string;

  // CRM
  offers: Offer[];
  reminders: Reminder[];

  // linking (multi-parcel / multi-site)
  linkedParcels: string[];
  linkedSites: string[];
};

type ProjectsContextValue = {
  sites: Site[];

  addSite: (site: { address: string; lat: number; lng: number }) => void;
  removeSite: (id: string) => void;
  clearSites: () => void;

  updateSiteStage: (id: string, stage: SiteStage) => void;

  updateSiteContact: (id: string, contact: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
  }) => void;

  updateSiteExtraContacts: (id: string, extra: {
    postalAddress?: string;
    solicitorName?: string;
    solicitorEmail?: string;
    solicitorPhone?: string;
    solicitorCompany?: string;
    solicitorAddress?: string;
  }) => void;

  updateSiteDetails: (id: string, details: {
    siteSize?: string;
    siteSizeUnit?: SiteSizeUnit;
    titleNumber?: string;
  }) => void;

  addNote: (id: string, text: string) => void;

  addOffer: (id: string, offer: {
    amount: string;
    date?: string;       // if omitted we’ll use “today”
    status: OfferStatus;
    note?: string;
  }) => void;

  addReminder: (id: string, reminder: {
    text: string;
    dueDate?: string;
  }) => void;

  setLinkedParcels: (id: string, parcels: string[]) => void;
  setLinkedSites: (id: string, sites: string[]) => void;
};

const ProjectsContext = createContext<ProjectsContextValue | undefined>(
  undefined
);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<Site[]>([]);

  const addSite: ProjectsContextValue["addSite"] = ({ address, lat, lng }) => {
    setSites((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        address,
        lat,
        lng,
        createdAt: new Date().toISOString(),
        stage: "uncategorised",
        notes: [],
        // new fields default values
        offers: [],
        reminders: [],
        linkedParcels: [],
        linkedSites: [],
        siteSizeUnit: "sqft",
      },
      ...prev,
    ]);
  };

  const removeSite = (id: string) => {
    setSites((prev) => prev.filter((s) => s.id !== id));
  };

  const clearSites = () => {
    setSites([]);
  };

  const updateSiteStage: ProjectsContextValue["updateSiteStage"] = (
    id,
    stage
  ) => {
    setSites((prev) =>
      prev.map((s) => (s.id === id ? { ...s, stage } : s))
    );
  };

  const updateSiteContact: ProjectsContextValue["updateSiteContact"] = (
    id,
    { name, email, phone, company }
  ) => {
    setSites((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              contactName: name ?? s.contactName,
              contactEmail: email ?? s.contactEmail,
              contactPhone: phone ?? s.contactPhone,
              contactCompany: company ?? s.contactCompany,
            }
          : s
      )
    );
  };

  const updateSiteExtraContacts: ProjectsContextValue["updateSiteExtraContacts"] =
    (id, extra) => {
      setSites((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                postalAddress:
                  extra.postalAddress ?? s.postalAddress,
                solicitorName:
                  extra.solicitorName ?? s.solicitorName,
                solicitorEmail:
                  extra.solicitorEmail ?? s.solicitorEmail,
                solicitorPhone:
                  extra.solicitorPhone ?? s.solicitorPhone,
                solicitorCompany:
                  extra.solicitorCompany ?? s.solicitorCompany,
                solicitorAddress:
                  extra.solicitorAddress ?? s.solicitorAddress,
              }
            : s
        )
      );
    };

  const updateSiteDetails: ProjectsContextValue["updateSiteDetails"] = (
    id,
    details
  ) => {
    setSites((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              siteSize: details.siteSize ?? s.siteSize,
              siteSizeUnit: details.siteSizeUnit ?? s.siteSizeUnit,
              titleNumber: details.titleNumber ?? s.titleNumber,
            }
          : s
      )
    );
  };

  const addNote: ProjectsContextValue["addNote"] = (id, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setSites((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              notes: [
                {
                  id: `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`,
                  text: trimmed,
                  createdAt: new Date().toISOString(),
                },
                ...s.notes,
              ],
            }
          : s
      )
    );
  };

  const addOffer: ProjectsContextValue["addOffer"] = (
    id,
    { amount, date, status, note }
  ) => {
    const trimmedAmount = amount.trim();
    if (!trimmedAmount) return;

    const today = new Date().toISOString().slice(0, 10);

    setSites((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              offers: [
                {
                  id: `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`,
                  amount: trimmedAmount,
                  date: date || today,
                  status,
                  note: note?.trim() || undefined,
                },
                ...s.offers,
              ],
            }
          : s
      )
    );
  };

  const addReminder: ProjectsContextValue["addReminder"] = (
    id,
    { text, dueDate }
  ) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    setSites((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              reminders: [
                {
                  id: `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`,
                  text: trimmedText,
                  dueDate,
                },
                ...s.reminders,
              ],
            }
          : s
      )
    );
  };

  const setLinkedParcels: ProjectsContextValue["setLinkedParcels"] = (
    id,
    parcels
  ) => {
    setSites((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, linkedParcels: parcels } : s
      )
    );
  };

  const setLinkedSites: ProjectsContextValue["setLinkedSites"] = (
    id,
    linked
  ) => {
    setSites((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, linkedSites: linked } : s
      )
    );
  };

  const value = useMemo(
    () => ({
      sites,
      addSite,
      removeSite,
      clearSites,
      updateSiteStage,
      updateSiteContact,
      updateSiteExtraContacts,
      updateSiteDetails,
      addNote,
      addOffer,
      addReminder,
      setLinkedParcels,
      setLinkedSites,
    }),
    [sites]
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) {
    throw new Error("useProjects must be used within a ProjectsProvider");
  }
  return ctx;
}
