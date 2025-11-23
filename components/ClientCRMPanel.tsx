"use client";

import { useEffect, useState } from "react";
// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"; // if you're using this

type ClientStatus = "Lead" | "Contacted" | "Negotiating" | "Active" | "Dormant";

type Client = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  owner_name?: string | null; // optional, from a join
  last_contacted_at?: string | null;
  next_action?: string | null;
  next_action_date?: string | null;
};

export function ClientCRMPanel() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "All">("All");
  const [isLoading, setIsLoading] = useState(false);

  // const supabase = createClientComponentClient(); // if using auth helpers

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        // TODO: wire up Supabase query
        // const { data, error } = await supabase
        //   .from("clients")
        //   .select("*")
        //   .order("created_at", { ascending: false });

        // if (error) throw error;
        // setClients(data as Client[]);
      } catch (err) {
        console.error("Error loading clients", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const filtered = clients.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ? true : c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Clients</h2>
          <p className="text-xs text-gray-500">
            Developer CRM – track relationships & next actions.
          </p>
        </div>
        <button
          className="text-xs px-2 py-1 rounded bg-black text-white"
          // TODO: open create form modal
        >
          + New client
        </button>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b space-y-2">
        <input
          type="text"
          placeholder="Search by name or company"
          className="w-full border rounded px-2 py-1 text-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-500">Status:</span>
          <select
            className="border rounded px-2 py-1 text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="All">All</option>
            <option value="Lead">Lead</option>
            <option value="Contacted">Contacted</option>
            <option value="Negotiating">Negotiating</option>
            <option value="Active">Active</option>
            <option value="Dormant">Dormant</option>
          </select>
        </div>
      </div>

      {/* Body: list + detail */}
      <div className="flex-1 flex overflow-hidden">
        {/* List */}
        <div className="w-1/2 border-r overflow-y-auto text-xs">
          {isLoading && (
            <div className="p-4 text-gray-500 text-xs">Loading clients…</div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="p-4 text-gray-500 text-xs">
              No clients yet. Add your first developer using “New client”.
            </div>
          )}
          {filtered.map((client) => (
            <button
              key={client.id}
              className={`w-full text-left px-3 py-2 border-b hover:bg-gray-50 ${
                selectedClient?.id === client.id ? "bg-gray-100" : ""
              }`}
              onClick={() => setSelectedClient(client)}
            >
              <div className="font-medium text-xs">{client.name}</div>
              {client.company && (
                <div className="text-[11px] text-gray-500">
                  {client.company}
                </div>
              )}
              <div className="flex justify-between items-center mt-1">
                <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] border">
                  {client.status}
                </span>
                {client.owner_name && (
                  <span className="text-[10px] text-gray-500">
                    Owner: {client.owner_name}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Detail */}
        <div className="flex-1 overflow-y-auto p-4 text-xs">
          {!selectedClient && (
            <div className="text-gray-500">
              Select a client to see details and next actions.
            </div>
          )}

          {selectedClient && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">
                  {selectedClient.name}
                </h3>
                {selectedClient.company && (
                  <p className="text-xs text-gray-500">
                    {selectedClient.company}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {selectedClient.email && (
                  <div>
                    <div className="text-[10px] text-gray-500 mb-1">Email</div>
                    <div>{selectedClient.email}</div>
                  </div>
                )}
                {selectedClient.phone && (
                  <div>
                    <div className="text-[10px] text-gray-500 mb-1">Phone</div>
                    <div>{selectedClient.phone}</div>
                  </div>
                )}
                <div>
                  <div className="text-[10px] text-gray-500 mb-1">Status</div>
                  <div className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] border">
                    {selectedClient.status}
                  </div>
                </div>
                {selectedClient.last_contacted_at && (
                  <div>
                    <div className="text-[10px] text-gray-500 mb-1">
                      Last contacted
                    </div>
                    <div>
                      {new Date(
                        selectedClient.last_contacted_at
                      ).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {selectedClient.next_action && (
                <div>
                  <div className="text-[10px] text-gray-500 mb-1">
                    Next action
                  </div>
                  <div>{selectedClient.next_action}</div>
                  {selectedClient.next_action_date && (
                    <div className="text-[10px] text-gray-500 mt-1">
                      Due{" "}
                      {new Date(
                        selectedClient.next_action_date
                      ).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
