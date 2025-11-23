// components/AuthHeader.tsx
"use client";

type Props = { right?: React.ReactNode };

export default function AuthHeader({ right }: Props) {
  return (
    <header className="header">
      <div className="container headerRow">
        <div className="brand">
          <span className="brandLogo" aria-hidden />
          <span>Landhunt</span>
        </div>

        <nav className="nav" aria-label="Primary">
          <a href="/">Home</a>
          <a href="/#pricing">Pricing</a>
          <a href="/#contact">Contact</a>
        </nav>

        <div className="navCta">{right}</div>
      </div>
    </header>
  );
}
