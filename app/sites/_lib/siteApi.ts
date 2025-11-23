// app/sites/_lib/siteApi.ts
import type { Site } from "@/app/clients/_lib/types";

const base = "/api/sites";

export async function fetchSites(): Promise<Site[]> {
  const res = await fetch(base, { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as Site[];
}

export async function fetchSite(id: string): Promise<Site | null> {
  const res = await fetch(`${base}/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as Site;
}

export async function createSiteApi(
  payload: Partial<Site> & { name: string }
): Promise<Site | null> {
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return (await res.json()) as Site;
}

export async function updateSiteApi(
  id: string,
  updates: Partial<Site>
): Promise<Site | null> {
  const res = await fetch(`${base}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) return null;
  return (await res.json()) as Site;
}

export async function deleteSiteApi(id: string): Promise<boolean> {
  const res = await fetch(`${base}/${id}`, { method: "DELETE" });
  return res.ok;
}
