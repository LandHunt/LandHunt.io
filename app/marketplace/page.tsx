// app/marketplace/page.tsx
"use client";

import React from "react";

const MarketplacePage: React.FC = () => {
  return (
    <main
      style={{
        minHeight: "calc(100vh - 52px)",
        padding: "24px 24px 40px 24px",
        color: "white",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, system-ui, 'SF Pro Text', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 650,
          }}
        >
          Marketplace
        </h1>
        <p
          style={{
            marginTop: 4,
            fontSize: 13,
            opacity: 0.75,
          }}
        >
          This is a placeholder for future marketplace features. The shared
          navigation bar is already wired up.
        </p>
      </div>
    </main>
  );
};

export default MarketplacePage;
