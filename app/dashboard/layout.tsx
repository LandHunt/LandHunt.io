import { ReactNode } from "react";
import { ProjectsProvider } from "@/lib/projects-context";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <ProjectsProvider>{children}</ProjectsProvider>;
}
