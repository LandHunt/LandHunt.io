// app/clients/_lib/serverStore.ts
import fs from "fs/promises";
import path from "path";
import type { Client, ActivityType, ClientDocument } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "clients.json");

// --------------------------------------------------
// Ensure file exists
// --------------------------------------------------

async function ensureFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

// --------------------------------------------------
// Load + save
// --------------------------------------------------

async function loadClients(): Promise<Client[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    return JSON.parse(raw) as Client[];
  } catch (err) {
    console.error("Failed to parse clients.json, resetting to []", err);
    return [];
  }
}

async function saveClients(clients: Client[]) {
  await ensureFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(clients, null, 2), "utf8");
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

export async function getClients() {
  return loadClients();
}

export async function getClientById(id: string) {
  const all = await loadClients();
  return all.find((c) => c.id === id) ?? null;
}

export async function createClient(
  data: Omit<Client, "id" | "createdAt">
): Promise<Client> {
  const all = await loadClients();

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  const client: Client = {
    id,
    createdAt: Date.now(),
    name: data.name.trim(),
    company: data.company?.trim() || undefined,
    email: data.email?.trim() || undefined,
    phone: data.phone?.trim() || undefined,
    stage: data.stage || "lead",
    valueGBP: typeof data.valueGBP === "number" ? data.valueGBP : undefined,
    tags: data.tags ?? [],
    activity: data.activity ?? [],
    documents: data.documents ?? [],
  };

  all.push(client);
  await saveClients(all);

  return client;
}

export async function updateClient(id: string, updates: Partial<Client>) {
  const all = await loadClients();
  const index = all.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const updated: Client = {
    ...all[index],
    ...updates,
    id, // never change
  };

  all[index] = updated;
  await saveClients(all);

  return updated;
}

export async function deleteClient(id: string) {
  const all = await loadClients();
  const remaining = all.filter((c) => c.id !== id);

  if (remaining.length === all.length) return false;

  await saveClients(remaining);
  return true;
}

// --------------------------------------------------
// Activity
// --------------------------------------------------

export async function addActivityToClient(
  clientId: string,
  activity: { type: ActivityType; text: string }
) {
  const all = await loadClients();
  const idx = all.findIndex((c) => c.id === clientId);
  if (idx === -1) return null;

  const client = all[idx];

  const newActivity = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    at: Date.now(),
    ...activity,
  };

  const updated: Client = {
    ...client,
    activity: [...(client.activity ?? []), newActivity],
  };

  all[idx] = updated;
  await saveClients(all);
  return updated;
}

// --------------------------------------------------
// Documents
// --------------------------------------------------

export async function addDocumentToClient(
  clientId: string,
  doc: Omit<ClientDocument, "id" | "uploadedAt">
) {
  const all = await loadClients();
  const idx = all.findIndex((c) => c.id === clientId);
  if (idx === -1) return null;

  const client = all[idx];

  const newDoc: ClientDocument = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    uploadedAt: Date.now(),
    ...doc,
  };

  const updated: Client = {
    ...client,
    documents: [...(client.documents ?? []), newDoc],
  };

  all[idx] = updated;
  await saveClients(all);

  return updated;
}

export async function deleteDocumentFromClient(
  clientId: string,
  docId: string
) {
  const all = await loadClients();
  const idx = all.findIndex((c) => c.id === clientId);
  if (idx === -1) return null;

  const client = all[idx];

  const updated: Client = {
    ...client,
    documents: (client.documents ?? []).filter((d) => d.id !== docId),
  };

  all[idx] = updated;
  await saveClients(all);
  return updated;
}
