// app/api/clients/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function requireTenant(req: Request): string | null {
  const t = req.headers.get("x-outseta-account");
  return t && t !== "null" ? t : null;
}

export async function GET(req: Request) {
  const tenant = requireTenant(req);
  if (!tenant) return NextResponse.json({ error: "Missing tenant" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("*")
    .eq("account_uid", tenant)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const tenant = requireTenant(req);
  const userUid = req.headers.get("x-outseta-user") || null;
  if (!tenant) return NextResponse.json({ error: "Missing tenant" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const payload = {
    name: body.name.trim(),
    company: body.company?.trim() || null,
    jobtitle: body.jobTitle?.trim() || null,
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    stage: body.stage ?? "lead",
    valuegbp: typeof body.valueGBP === "number" ? body.valueGBP : null,
    tags: Array.isArray(body.tags) ? body.tags : [],
    siteids: Array.isArray(body.siteIds) ? body.siteIds : [],
    activity: [],
    documents: [],
    account_uid: tenant,
    created_by: userUid,
  };

  const { data, error } = await supabaseAdmin
    .from("clients")
    .insert(payload)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
