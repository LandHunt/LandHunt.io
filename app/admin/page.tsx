// app/admin/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

function isAdmin(email?: string | null) {
  const list = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!isAdmin(session.user?.email)) redirect("/");

  return (
    <main className="page">
      <section className="section container">
        <h1>Admin</h1>
        <p className="muted">Only admins can see this.</p>
      </section>
    </main>
  );
}
