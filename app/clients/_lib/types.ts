// app/clients/_lib/types.ts

// ---- Activity / notes ----
export type ActivityType = "note" | "email" | "call";

export interface ActivityItem {
  id: string;
  at: number; // timestamp (ms)
  type: ActivityType;
  text: string;
}

// ---- Documents ----
export interface ClientDocument {
  id: string;
  name: string;      // human-friendly name
  fileName: string;  // stored/original file name
  url: string;       // public URL
  uploadedAt: number;
}

// ---- Clients ("My Clients") ----
export type ClientStage = "lead" | "active" | "won" | "lost";

export interface Client {
  id: string;
  createdAt: number;

  name: string;
  company?: string;
  jobTitle?: string | null;
  email?: string;
  phone?: string;

  stage: ClientStage;
  valueGBP?: number;
  tags?: string[];

  activity?: ActivityItem[];
  documents?: ClientDocument[];

  // linked sites
  siteIds?: string[]; // array of Site.id values
}

// ---- Sites ("My Sites") ----
export type SiteStatus =
  | "target"
  | "contacted"
  | "appraisal"
  | "under-offer"
  | "acquired";

export interface Site {
  id: string;
  createdAt: number;

  name: string;
  address?: string;
  locationNotes?: string;
  status?: SiteStatus;

  sizeAcres?: number;
  valueGBP?: number;
  tags?: string[];

  // linked clients
  clientIds?: string[]; // array of Client.id values
}
