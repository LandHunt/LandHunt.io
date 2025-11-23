// app/clients/_lib/clientApi.ts
import type { Client, ClientStage, ActivityType, ClientDocument } from "./types";
import { fetchWithOutseta } from "@/app/lib/fetchWithOutseta";

const base = "/api/clients";

/* ------------------------ LIST + DETAIL ------------------------ */

export async function fetchClients(): Promise<Client[]> {
  const res = await fetchWithOutseta(base, { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as Client[];
}

export async function fetchClient(id: string): Promise<Client | null> {
  const res = await fetchWithOutseta(`${base}/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as Client;
}

/** Exact company match */
export async function fetchClientsByCompany(company: string): Promise<Client[]> {
  const res = await fetchWithOutseta(
    `${base}?company=${encodeURIComponent(company)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as Client[];
  return data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

/* --------------- CREATE / UPDATE / DELETE CLIENT --------------- */

export async function createClientApi(
  payload: Partial<Client> & { name: string }
): Promise<Client | null> {
  const body: Partial<Client> = {
    name: payload.name?.trim(),
    company: payload.company?.trim() || undefined,
    jobTitle: payload.jobTitle?.trim() || undefined,
    email: payload.email?.trim() || undefined,
    phone: payload.phone?.trim() || undefined,
    stage: (payload.stage as ClientStage) || "lead",
    valueGBP:
      typeof payload.valueGBP === "number" ? payload.valueGBP : undefined,
    tags: payload.tags ?? [],
    siteIds: payload.siteIds ?? [],
    activity: [],
    documents: [],
  };

  const res = await fetchWithOutseta(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await safeJson(res);
    console.error("createClientApi failed:", err?.error || res.statusText);
    return null;
  }
  return (await res.json()) as Client;
}

export async function updateClient(
  id: string,
  updates: Partial<Client>
): Promise<Client | null> {
  const normalized: Partial<Client> = {
    ...updates,
    name: updates.name?.trim() ?? updates.name,
    company: updates.company?.trim() ?? updates.company,
    jobTitle: updates.jobTitle?.trim() ?? updates.jobTitle,
    email: updates.email?.trim() ?? updates.email,
    phone: updates.phone?.trim() ?? updates.phone,
  };

  const res = await fetchWithOutseta(`${base}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalized),
  });
  if (!res.ok) {
    const err = await safeJson(res);
    console.error("updateClient failed:", err?.error || res.statusText);
    return null;
  }
  return (await res.json()) as Client;
}

export async function deleteClientApi(id: string): Promise<boolean> {
  const res = await fetchWithOutseta(`${base}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await safeJson(res);
    console.error("deleteClientApi failed:", err?.error || res.statusText);
  }
  return res.ok;
}

/* ----------------------------- ACTIVITY ----------------------------- */

export async function addActivityApi(
  id: string,
  payload: { type: ActivityType; text: string }
): Promise<Client | null> {
  const res = await fetchWithOutseta(`${base}/${id}/activity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await safeJson(res);
    console.error("addActivityApi failed:", err?.error || res.statusText);
    return null;
  }
  return (await res.json()) as Client;
}

/* ---------------------------- DOCUMENTS ---------------------------- */

export async function uploadDocumentApi(
  id: string,
  file: File,
  name: string
): Promise<Client | null> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("name", name);

  const res = await fetchWithOutseta(`${base}/${id}/documents`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const err = await safeJson(res);
    console.error("uploadDocumentApi failed:", err?.error || res.statusText);
    return null;
  }
  return (await res.json()) as Client;
}

export async function deleteDocumentApi(
  clientId: string,
  docId: string
): Promise<Client | null> {
  const res = await fetchWithOutseta(
    `${base}/${clientId}/documents/${docId}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    const err = await safeJson(res);
    console.error("deleteDocumentApi failed:", err?.error || res.statusText);
    return null;
  }
  return (await res.json()) as Client;
}

/* ------------------------------- Types ------------------------------ */

export type { Client, ClientStage, ActivityType, ClientDocument };

/* ------------------------------ Helpers ----------------------------- */

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
