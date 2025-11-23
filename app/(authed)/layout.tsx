// app/(authed)/layout.tsx  — TEMP BYPASS
export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  // Temporarily do not check token/user
  return <>{children}</>;
}
