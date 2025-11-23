// app/clients/_lib/store.ts

export type ClientStage = "lead" | "active" | "won" | "lost";

export type ActivityType = "note" | "call" | "email";

export type Activity = {
  id: string;
  type: ActivityType;
  text: string;
  at: number;
};

export type ClientDocument = {
  id: string;
  name: string;       // user-defined display name
  fileName: string;   // original file name
  url: string;        // file URL (object URL or from your upload API)
  uploadedAt: number;
};

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  stage: ClientStage;
  valueGBP?: number;
  tags?: string[];
  createdAt: number;
  activity?: Activity[];
  documents?: ClientDocument[];
}

// ------- basic storage layer (localStorage + in-memory fallback) -------

const STORAGE_KEY = "landcrm_clients";

let memoryStore: Client[] = [];

/**
 * Internal loader – DO NOT import this in your pages.
 * Use getClients() / loadClients() instead.
 */
function _loadClients(): Client[] {
  if (typeof window === "undefined") {
    return memoryStore;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return memoryStore;
    const parsed = JSON.parse(raw) as Client[];
    memoryStore = parsed;
    return parsed;
  } catch {
    return memoryStore;
  }
}

/**
 * Internal saver
 */
function _saveClients(clients: Client[]) {
  memoryStore = clients;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  } catch {
    // ignore
  }
}

// ------- PUBLIC API (what your pages/components should import) -------

export function getClients(): Client[] {
  return _loadClients();
}

/**
 * Backwards-compat shim:
 * Some older code in your app is still importing `loadClients`.
 * Re-export it so those imports keep working.
 */
export function loadClients(): Client[] {
  return _loadClients();
}

export function getClient(id: string): Client | null {
  return _loadClients().find((c) => c.id === id) ?? null;
}

export function upsertClient(client: Client) {
  const all = _loadClients();
  const idx = all.findIndex((c) => c.id === client.id);
  const next = [...all];
  if (idx === -1) {
    next.push(client);
  } else {
    next[idx] = client;
  }
  _saveClients(next);
}

export function deleteClient(id: string) {
  const all = _loadClients();
  const next = all.filter((c) => c.id !== id);
  _saveClients(next);
}

// ------- activity helpers -------

export function addActivity(
  clientId: string,
  activity: { type: ActivityType; text: string }
) {
  const client = getClient(clientId);
  if (!client) return;

  const newActivity: Activity = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    type: activity.type,
    text: activity.text,
    at: Date.now(),
  };

  const updated: Client = {
    ...client,
    activity: [...(client.activity ?? []), newActivity],
  };

  upsertClient(updated);
}

// ------- document helpers -------

export function addClientDocument(
  clientId: string,
  doc: Omit<ClientDocument, "id" | "uploadedAt">
): ClientDocument | null {
  const client = getClient(clientId);
  if (!client) return null;

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

  upsertClient(updated);
  return newDoc;
}

export function deleteClientDocument(clientId: string, docId: string) {
  const client = getClient(clientId);
  if (!client) return;

  const updated: Client = {
    ...client,
    documents: (client.documents ?? []).filter((d) => d.id !== docId),
  };

  upsertClient(updated);
}
