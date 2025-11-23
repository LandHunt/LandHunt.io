// app/api/sites/[id]/route.ts
import { NextResponse } from "next/server";
import {
  getSiteById,
  updateSite,
  deleteSite,
} from "@/app/sites/_lib/siteServerStore";
import type { Site } from "@/app/clients/_lib/types";

type Params = { params: { id: string } };

// GET /api/sites/:id
export async function GET(_req: Request, { params }: Params) {
  try {
    const site = await getSiteById(params.id);
    if (!site) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(site, { status: 200 });
  } catch (err) {
    console.error("GET /api/sites/[id] error", err);
    return NextResponse.json(
      { error: "Failed to load site" },
      { status: 500 }
    );
  }
}

// PUT /api/sites/:id
export async function PUT(req: Request, { params }: Params) {
  try {
    const updates = (await req.json()) as Partial<Site>;
    const updated = await updateSite(params.id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("PUT /api/sites/[id] error", err);
    return NextResponse.json(
      { error: "Failed to update site" },
      { status: 500 }
    );
  }
}

// DELETE /api/sites/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const ok = await deleteSite(params.id);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/sites/[id] error", err);
    return NextResponse.json(
      { error: "Failed to delete site" },
      { status: 500 }
    );
  }
}
