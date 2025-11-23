// app/providers.tsx
"use client";

import { ProjectsProvider } from "@/app/context/ProjectsContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ProjectsProvider>{children}</ProjectsProvider>;
}
