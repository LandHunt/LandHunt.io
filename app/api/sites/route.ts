// app/api/sites/route.ts
import { NextResponse } from "next/server";
import { getSites, createSite } from "@/app/sites/_lib/siteServerStore";
import type { Site } from "@/app/clients/_lib/types";

// GET /api/sites
export async function GET() {
  try {
    const sites = await getSites(); // ✅ this is the one from siteServerStore
    return NextResponse.json(sites, { status: 200 });
  } catch (err) {
    console.error("GET /api/sites error", err);
    return NextResponse.json(
      { error: "Failed to load sites" },
      { status: 500 }
    );
  }
}

// POST /api/sites
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Omit<Site, "id" | "createdAt">;

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const created = await createSite(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/sites error", err);
    return NextResponse.json(
      { error: "Failed to create site" },
      { status: 500 }
    );
  }
}
