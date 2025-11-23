import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AuthButton from "./components/AuthButton";

export default function MarketingPage() {
  const hasSession = cookies().get("lh_session")?.value === "1";
  if (hasSession) redirect("/dashboard");

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% -10%, #0b1220, #020617)",
        color: "#f8fafc",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, system-ui, 'SF Pro Text', sans-serif",
      }}
    >
      <TopBar />
      <Hero />
      <TrustBar />
      <FeatureSection />
      <CompareGrid />
      <Pricing />
      <Callout />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}

/* ───── Top bar ───── */

function TopBar() {
  return (
    <div
      style={{
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 20,
        background:
          "linear-gradient(180deg, rgba(2,6,23,0.9), rgba(2,6,23,0.7), transparent)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 10px",
          borderRadius: 10,
          border: "1px solid rgba(30,64,175,0.6)",
          background: "rgba(15,23,42,0.94)",
          boxShadow: "0 8px 18px rgba(15,23,42,0.6)",
          fontWeight: 700,
          letterSpacing: 0.3,
        }}
      >
        <span style={{ fontSize: 13.5, opacity: 0.9 }}>🔎</span>
        <span style={{ fontSize: 13.5 }}>Landhunt</span>
      </div>

      <nav style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <a href="#features" style={navLink}>Features</a>
        <a href="#pricing" style={navLink}>Pricing</a>
        <a href="#faq" style={navLink}>FAQ</a>
        <AuthButton kind="login" label="Log in" variant="ghost" />
        <AuthButton kind="signup" label="Create account" variant="primary" />
      </nav>
    </div>
  );
}

/* ───── Hero ───── */

function Hero() {
  return (
    <section style={{ maxWidth: 1100, margin: "48px auto 16px", padding: "0 18px" }}>
      <div style={cardLarge}>
        <h1 style={{ fontSize: 42, lineHeight: 1.1, fontWeight: 900, letterSpacing: 0.2, margin: 0 }}>
          Find, assess, and plan sites faster.
        </h1>
        <p style={{ marginTop: 12, fontSize: 15, opacity: 0.9, maxWidth: 760 }}>
          Landhunt brings address search, parcel boundaries, sales history (PPD),
          sketch tools, and project tracking together—so your team can evaluate
          opportunities in minutes, not days.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
          <AuthButton kind="signup" label="Start free (no card)" variant="primaryLg" />
          <AuthButton kind="login" label="Log in" variant="secondaryLg" />
          <a href="#pricing" style={{ ...pillLink, padding: "12px 18px", fontSize: 13.5 }}>
            See pricing
          </a>
        </div>

        <ul style={bulletGrid}>
          {[
            ["UK-wide address & parcel search", "Jump anywhere quickly."],
            ["PPD sales around a point", "Understand local comps in seconds."],
            ["Sketch lines & polygons", "Rough-out road access and site area."],
            ["Save candidate sites", "Build a pipeline you can action."],
          ].map(([title, desc]) => (
            <li key={title} style={bulletItem}>
              <span style={greenDot} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{title}</div>
                <div style={{ opacity: 0.9, fontSize: 12.5 }}>{desc}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───── Trust ───── */

function TrustBar() {
  return (
    <section style={{ maxWidth: 1100, margin: "6px auto 24px", padding: "0 18px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          ["10k+", "Parcels explored monthly"],
          ["2–5x", "Faster site triage"],
          ["99.9%", "Uptime last 90 days"],
        ].map(([big, small]) => (
          <div key={big} style={statCard}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{big}</div>
            <div style={{ opacity: 0.85, fontSize: 12.5 }}>{small}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───── Features ───── */

function FeatureSection() {
  return (
    <section id="features" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 18px 14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FeatureCard
          title="Map-first workflow"
          desc="Type a UK address or click the map to jump. Inspect parcel edges, OS Open data overlays, and draw quick shapes to reason about access and area."
          bullets={["Fast address & postcode search", "Parcel boundaries & context layers", "Line/polygon sketch tools"]}
        />
        <FeatureCard
          title="Sales comps in context"
          desc="See Land Registry PPD transactions around a point to sanity-check opportunity pricing and velocity."
          bullets={["Recent sales near a point", "Filter by distance", "Quick open in LR"]}
        />
        <FeatureCard
          title="Project pipeline"
          desc="Save candidate sites into lightweight projects with notes, tags, and simple collaboration."
          bullets={["Quick-save from the map", "Client/Company contact linking", "Upload heads of terms & docs"]}
        />
        <FeatureCard
          title="CRM-lite clients"
          desc="Track contact details, documents, and activity. Link a client to multiple sites or vice versa."
          bullets={["Notes, calls, emails", "Document hub", "Linked sites with search"]}
        />
      </div>
    </section>
  );
}

function FeatureCard({ title, desc, bullets }: { title: string; desc: string; bullets: string[] }) {
  return (
    <div style={card}>
      <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{title}</div>
      <div style={{ opacity: 0.9, fontSize: 13.5 }}>{desc}</div>
      <ul style={{ marginTop: 10, paddingLeft: 18 }}>
        {bullets.map((b) => (
          <li key={b} style={{ fontSize: 12.5, opacity: 0.95, marginTop: 4 }}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

/* ───── Compare ───── */

function CompareGrid() {
  const rows = [
    ["Address & postcode search", "✓", "✓"],
    ["Parcel boundaries", "✓", "Limitations / slow"],
    ["Draw lines & polygons", "✓", "Often missing"],
    ["PPD comps around a point", "✓", "Spreadsheet export"],
    ["Save to projects", "✓", "Manual bookmarking"],
    ["Client CRM-lite", "✓", "External tool"],
  ];
  return (
    <section style={{ maxWidth: 1100, margin: "8px auto 24px", padding: "0 18px" }}>
      <div style={{ borderRadius: 16, border: "1px solid rgba(51,65,85,0.9)", overflow: "hidden" }}>
        <div style={tableHead}>
          <div>Capability</div>
          <div style={{ textAlign: "center" }}>Landhunt</div>
          <div style={{ textAlign: "center" }}>Typical tools</div>
        </div>
        {rows.map(([cap, a, b], i) => (
          <div key={cap} style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "10px 12px", fontSize: 12.5,
            background: i % 2 === 0 ? rowBgA : rowBgB, borderTop: "1px solid rgba(51,65,85,0.9)"
          }}>
            <div>{cap}</div>
            <div style={{ textAlign: "center", fontWeight: 700 }}>{a}</div>
            <div style={{ textAlign: "center" }}>{b}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───── Pricing ───── */

function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "£0",
      period: "forever",
      cta: { label: "Start free", kind: "signup" as const },
      highlights: ["Address & parcel search", "Sketch lines & polygons", "Save up to 20 sites", "Basic PPD comps"],
    },
    {
      name: "Pro",
      price: "£39",
      period: "per user / mo",
      badge: "Popular",
      cta: { label: "Start 14-day trial", kind: "signup" as const },
      highlights: ["Everything in Free", "Unlimited saved sites", "Enhanced PPD comps", "Document hub & notes"],
    },
    {
      name: "Team",
      price: "£129",
      period: "per team / mo",
      cta: { label: "Talk to us", kind: "signup" as const },
      highlights: ["Everything in Pro", "3 seats included", "Shared projects & roles", "Priority support"],
    },
  ];

  return (
    <section id="pricing" style={{ maxWidth: 1100, margin: "8px auto 10px", padding: "0 18px" }}>
      <h2 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 12px" }}>Simple pricing</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {plans.map((p) => (
          <div key={p.name} style={{
            ...card, position: "relative",
            boxShadow: p.badge ? "0 25px 60px rgba(37,99,235,0.25)" : undefined
          }}>
            {p.badge && (
              <div style={{
                position: "absolute", top: 12, right: 12, padding: "4px 8px", borderRadius: 999,
                border: "1px solid rgba(191,219,254,0.9)", background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                fontSize: 11, fontWeight: 700
              }}>
                {p.badge}
              </div>
            )}

            <div style={{ fontWeight: 800, fontSize: 16 }}>{p.name}</div>
            <div style={{ marginTop: 6, display: "flex", alignItems: "end" }}>
              <div style={{ fontSize: 30, fontWeight: 900 }}>{p.price}</div>
              <div style={{ marginLeft: 6, opacity: 0.85, fontSize: 12.5 }}>{p.period}</div>
            </div>

            <ul style={{ marginTop: 10, paddingLeft: 18 }}>
              {p.highlights.map((h) => (
                <li key={h} style={{ fontSize: 12.5, opacity: 0.95, marginTop: 4 }}>{h}</li>
              ))}
            </ul>

            <div style={{ marginTop: 14 }}>
              <AuthButton
                kind={p.cta.kind}
                label={p.cta.label}
                variant={p.badge ? "primaryLg" : "secondaryLg"}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10, fontSize: 12.5, opacity: 0.8 }}>
        Prices exclude VAT. Team plan includes 3 seats; additional seats available on request.
      </div>
    </section>
  );
}

/* ───── CTA ───── */

function Callout() {
  return (
    <section style={{ maxWidth: 1100, margin: "16px auto", padding: "0 18px" }}>
      <div style={{
        borderRadius: 16, border: "1px solid rgba(34,197,94,0.6)",
        background: "linear-gradient(135deg, rgba(22,163,74,0.12), rgba(22,163,74,0.06))",
        padding: 18, display: "flex", gap: 12, alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap"
      }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Try Landhunt free today</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>No credit card required. Upgrade anytime.</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <AuthButton kind="signup" label="Create free account" variant="primaryLg" />
          <AuthButton kind="login" label="Log in" variant="secondaryLg" />
        </div>
      </div>
    </section>
  );
}

/* ───── Testimonials ───── */

function Testimonials() {
  const quotes = [
    ["We cut site triage from hours to minutes. The sketch tools are brilliant for quick feasibility.", "Alex W.", "Land Director"],
    ["Having sales comps right on the map is a game changer. Our team actually enjoys the process now.", "Priya K.", "Acquisitions"],
    ["The pipeline view keeps everyone aligned. Notes and HOTs in one place—finally.", "Tom R.", "Development Manager"],
  ];
  return (
    <section style={{ maxWidth: 1100, margin: "8px auto 18px", padding: "0 18px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 10px" }}>What teams say</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {quotes.map(([text, name, role]) => (
          <blockquote key={name as string} style={{ ...card, fontSize: 13.5, margin: 0 }}>
            “{text}”
            <footer style={{ marginTop: 10, fontSize: 12.5, opacity: 0.9 }}>— {name}, {role}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

/* ───── FAQ ───── */

function FAQ() {
  const items = [
    ["Do you cover the whole UK?", "Yes—address and postcode search are UK-wide. Parcel boundaries use national open data; we add optional context layers over time."],
    ["Where do the sales comps come from?", "We surface Land Registry Price Paid Data (PPD) around a point to give quick local context while you’re evaluating a site."],
    ["Can I collaborate with my team?", "Yes—save sites to shared projects on Team plans with roles, notes, and a simple document hub."],
    ["How does the free plan work?", "Free gives you core map tools and up to 20 saved sites—no credit card required. Upgrade anytime to unlock more."],
  ];
  return (
    <section id="faq" style={{ maxWidth: 1100, margin: "8px auto 24px", padding: "0 18px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 10px" }}>Frequently asked questions</h2>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map(([q, a]) => (
          <div key={q as string} style={faqItem}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{q}</div>
            <div style={{ marginTop: 4, opacity: 0.9, fontSize: 12.5 }}>{a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───── Footer ───── */

function Footer() {
  return (
    <footer style={{
      padding: "18px", opacity: 0.75, fontSize: 12.5, display: "flex",
      justifyContent: "space-between", maxWidth: 1100, margin: "0 auto"
    }}>
      <span>© {new Date().getFullYear()} Landhunt</span>
      <span>
        <a href="#pricing" style={navLink}>Pricing</a> ·{" "}
        <a href="#faq" style={navLink}>FAQ</a> ·{" "}
        <a href="mailto:hello@landhunt.io" style={navLink}>Contact</a>
      </span>
    </footer>
  );
}

/* ───── shared styles ───── */

const navLink: React.CSSProperties = {
  color: "rgba(226,232,240,0.95)",
  textDecoration: "none",
  fontSize: 12.5,
  opacity: 0.95,
};

const pillLink: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.7)",
  background: "transparent",
  color: "rgba(226,232,240,0.95)",
  fontSize: 13,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};

const cardLarge: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(51,65,85,0.9)",
  background: "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95))",
  boxShadow: "0 30px 70px rgba(2,6,23,0.85)",
  padding: "32px 26px",
};

const card: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(51,65,85,0.9)",
  background: "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95))",
  padding: 18,
};

const bulletGrid: React.CSSProperties = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  padding: 0,
  listStyle: "none",
  maxWidth: 900,
};

const bulletItem: React.CSSProperties = {
  display: "flex",
  gap: 10,
  border: "1px solid rgba(51,65,85,0.9)",
  background: "linear-gradient(135deg, rgba(15,23,42,0.99), rgba(15,23,42,0.97))",
  padding: 12,
  borderRadius: 12,
  alignItems: "flex-start",
};

const greenDot: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  marginTop: 5,
  background: "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.95), rgba(16,185,129,0.4))",
  boxShadow: "0 0 18px rgba(16,185,129,0.6)",
  flexShrink: 0,
};

const statCard: React.CSSProperties = {
  border: "1px solid rgba(51,65,85,0.9)",
  borderRadius: 12,
  padding: 14,
  textAlign: "center",
  background: "linear-gradient(135deg, rgba(15,23,42,0.99), rgba(15,23,42,0.97))",
};

const tableHead: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr",
  fontWeight: 800,
  fontSize: 13,
  background: "rgba(15,23,42,0.9)",
  padding: "10px 12px",
};

const rowBgA = "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.95))";
const rowBgB = "linear-gradient(135deg, rgba(15,23,42,0.97), rgba(15,23,42,0.94))";

const faqItem: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(51,65,85,0.9)",
  background: "linear-gradient(135deg, rgba(15,23,42,0.99), rgba(15,23,42,0.97))",
  padding: 14,
};
