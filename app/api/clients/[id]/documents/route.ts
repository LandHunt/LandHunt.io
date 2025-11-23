// app/api/clients/[id]/documents/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin, CLIENT_DOCS_BUCKET } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";
export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  const { id } = params;
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const name = (form.get("name") as string) || (file?.name ?? "Document");

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // storage path: clients/<clientId>/<uuid>-<filename>
  const fileName = file.name || "upload.bin";
  const key = `clients/${id}/${randomUUID()}-${fileName}`;

  // Upload to Storage
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadErr } = await supabaseAdmin.storage
    .from(CLIENT_DOCS_BUCKET)
    .upload(key, Buffer.from(arrayBuffer), {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  // Get public URL
  const { data: publicUrlData } = supabaseAdmin.storage.from(CLIENT_DOCS_BUCKET).getPublicUrl(key);
  const url = publicUrlData.publicUrl;

  // Append to documents array
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from("clients")
    .select("documents")
    .eq("id", id)
    .single();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 404 });

  const doc = {
    id: randomUUID(),
    name,
    fileName,
    url,
    storageKey: key,
    uploadedAt: new Date().toISOString(),
  };
  const nextDocs = [...(existing?.documents ?? []), doc];

  const { data, error } = await supabaseAdmin
    .from("clients")
    .update({ documents: nextDocs })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
