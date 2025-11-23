// app/sites/_lib/siteServerStore.ts
import fs from "fs/promises";
import path from "path";
import type { Site } from "@/app/clients/_lib/types";

const DATA_FILE = path.join(process.cwd(), "data", "sites.json");

async function ensureFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

async function loadSites(): Promise<Site[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    return JSON.parse(raw) as Site[];
  } catch (err) {
    console.error("Failed to parse sites.json, resetting to []", err);
    return [];
  }
}

async function saveSites(sites: Site[]) {
  await ensureFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(sites, null, 2), "utf8");
}

// ---------- PUBLIC API ----------

// ✅ THIS is the function the API imports
export async function getSites(): Promise<Site[]> {
  return loadSites();
}

export async function getSiteById(id: string): Promise<Site | null> {
  const all = await loadSites();
  return all.find((s) => s.id === id) ?? null;
}

export async function createSite(
  data: Omit<Site, "id" | "createdAt">
): Promise<Site> {
  const all = await loadSites();

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  const site: Site = {
    id,
    createdAt: Date.now(),
    name: data.name.trim(),
    address: data.address?.trim() || undefined,
    locationNotes: data.locationNotes?.trim() || undefined,
    status: data.status,
    sizeAcres:
      typeof data.sizeAcres === "number" ? data.sizeAcres : undefined,
    valueGBP:
      typeof data.valueGBP === "number" ? data.valueGBP : undefined,
    tags: data.tags ?? [],
    clientIds: data.clientIds ?? [],
  };

  all.push(site);
  await saveSites(all);

  return site;
}

export async function updateSite(
  id: string,
  updates: Partial<Site>
): Promise<Site | null> {
  const all = await loadSites();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const updated: Site = {
    ...all[idx],
    ...updates,
    id,
  };

  all[idx] = updated;
  await saveSites(all);
  return updated;
}

export async function deleteSite(id: string): Promise<boolean> {
  const all = await loadSites();
  const remaining = all.filter((s) => s.id !== id);
  if (remaining.length === all.length) return false;
  await saveSites(remaining);
  return true;
}
