"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token");
  const email = sp.get("email");
  const [msg, setMsg] = useState("Verifying...");

  useEffect(() => {
    if (!token || !email) { setMsg("Invalid link"); return; }
    (async () => {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMsg("Email verified! Redirecting to login...");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setMsg(data?.error || "Verification failed");
      }
    })();
  }, [token, email, router]);

  return (
    <main className="page">
      <section className="section container">
        <h1>{msg}</h1>
      </section>
    </main>
  );
}
