"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type Project = { id: string; name: string }; // adjust later
type Ctx = { projects: Project[]; addProject: (p: Project) => void };

const ProjectsCtx = createContext<Ctx | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const addProject = (p: Project) => setProjects((prev) => [...prev, p]);
  const value = useMemo(() => ({ projects, addProject }), [projects]);
  return <ProjectsCtx.Provider value={value}>{children}</ProjectsCtx.Provider>;
}

export function useProjects() {
  const ctx = useContext(ProjectsCtx);
  if (!ctx) throw new Error("useProjects must be used within a ProjectsProvider");
  return ctx;
}
