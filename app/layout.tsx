// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import NavBar from "./components/NavBar";
import OutsetaBoot from "./components/OutsetaBoot";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Landhunt",
  description: "Landhunt.io",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OutsetaBoot />
        <Providers>
          <NavBar />
          <div style={{ height: 56 }} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
