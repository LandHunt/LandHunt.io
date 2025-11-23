// lib/projectsStore.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type SavedSite = {
  id: string;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
  categoryId: string | null;
};

export type Category = {
  id: string;
  name: string;
  createdAt: string;
};

type ProjectsContextValue = {
  sites: SavedSite[];
  categories: Category[];
  addSite: (payload: { address: string; lat: number; lng: number }) => void;
  addCategory: (name: string) => void;
  assignSiteToCategory: (siteId: string, categoryId: string | null) => void;
  removeSite: (siteId: string) => void;
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

const STORAGE_KEY = "landhunt-projects-v1";

type PersistedState = {
  sites: SavedSite[];
  categories: Category[];
};

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sites, setSites] = useState<SavedSite[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // load from localStorage once on client
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedState;
      setSites(parsed.sites ?? []);
      setCategories(parsed.categories ?? []);
    } catch (e) {
      console.warn("Could not read projects from storage", e);
    }
  }, []);

  // persist whenever things change
  useEffect(() => {
    const state: PersistedState = { sites, categories };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Could not persist projects", e);
    }
  }, [sites, categories]);

  const addSite: ProjectsContextValue["addSite"] = ({
    address,
    lat,
    lng,
  }) => {
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const newSite: SavedSite = {
      id,
      address,
      lat,
      lng,
      createdAt: new Date().toISOString(),
      categoryId: null,
    };
    setSites((prev) => [newSite, ...prev]);
  };

  const addCategory: ProjectsContextValue["addCategory"] = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const category: Category = {
      id,
      name: trimmed,
      createdAt: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, category]);
  };

  const assignSiteToCategory: ProjectsContextValue["assignSiteToCategory"] = (
    siteId,
    categoryId
  ) => {
    setSites((prev) =>
      prev.map((s) => (s.id === siteId ? { ...s, categoryId } : s))
    );
  };

  const removeSite: ProjectsContextValue["removeSite"] = (siteId) => {
    setSites((prev) => prev.filter((s) => s.id !== siteId));
  };

  const value = useMemo<ProjectsContextValue>(
    () => ({
      sites,
      categories,
      addSite,
      addCategory,
      assignSiteToCategory,
      removeSite,
    }),
    [sites, categories]
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
};

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) {
    throw new Error("useProjects must be used inside <ProjectsProvider>");
  }
  return ctx;
}
