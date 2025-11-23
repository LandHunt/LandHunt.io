// app/api/clients/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const DEV_TENANT_FALLBACK = process.env.NODE_ENV !== "production";
const getTenant = (req: Request) =>
  req.headers.get("x-outseta-account") ?? (DEV_TENANT_FALLBACK ? "UNSET" : null);

type DbClient = {
  id: string; name: string; company: string | null; jobtitle: string | null;
  email: string | null; phone: string | null; stage: string | null;
  valuegbp: number | null; tags: string[] | null; siteids: string[] | null;
  activity: any[]; documents: any[]; created_at: string; account_uid: string;
};

const dbToApi = (r: DbClient) => ({
  id: r.id, name: r.name, company: r.company ?? undefined,
  jobTitle: r.jobtitle ?? undefined, email: r.email ?? undefined, phone: r.phone ?? undefined,
  stage: (r.stage as any) ?? "lead", valueGBP: r.valuegbp ?? undefined,
  tags: r.tags ?? [], siteIds: r.siteids ?? [], activity: r.activity ?? [],
  documents: r.documents ?? [], createdAt: r.created_at,
});

const apiToDb = (b: any): Partial<DbClient> => ({
  name: b.name?.trim() ?? b.name,
  company: b.company?.trim() ?? b.company ?? null,
  jobtitle: b.jobTitle?.trim() ?? b.jobTitle ?? null,
  email: b.email?.trim() ?? b.email ?? null,
  phone: b.phone?.trim() ?? b.phone ?? null,
  stage: b.stage ?? "lead",
  valuegbp: typeof b.valueGBP === "number" ? b.valueGBP : (b.valueGBP ?? null),
  tags: Array.isArray(b.tags) ? b.tags : b.tags,
  siteids: Array.isArray(b.siteIds) ? b.siteIds : b.siteIds,
  activity: Array.isArray(b.activity) ? b.activity : b.activity,
  documents: Array.isArray(b.documents) ? b.documents : b.documents,
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const tenant = getTenant(req);
  if (!tenant) return NextResponse.json({ error: "Missing tenant" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .eq("account_uid", tenant)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(dbToApi(data as DbClient));
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const tenant = getTenant(req);
  if (!tenant) return NextResponse.json({ error: "Missing tenant" }, { status: 401 });

  const body = await req.json();
  const payload = apiToDb(body);

  const { data, error } = await supabaseAdmin
    .from("clients")
    .update(payload)
    .eq("id", params.id)
    .eq("account_uid", tenant)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(dbToApi(data as DbClient));
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const tenant = getTenant(req);
  if (!tenant) return NextResponse.json({ error: "Missing tenant" }, { status: 401 });

  const { error } = await supabaseAdmin
    .from("clients")
    .delete()
    .eq("id", params.id)
    .eq("account_uid", tenant);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
