// app/api/clients/[id]/documents/[docId]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin, CLIENT_DOCS_BUCKET } from "@/lib/supabaseServer";

type Params = { params: { id: string; docId: string } };

export async function DELETE(_req: Request, { params }: Params) {
  const { id, docId } = params;

  // Fetch docs
  const { data: row, error: fetchErr } = await supabaseAdmin
    .from("clients")
    .select("documents")
    .eq("id", id)
    .single();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 404 });

  const docs = (row?.documents ?? []) as any[];
  const target = docs.find((d) => d.id === docId);
  const nextDocs = docs.filter((d) => d.id !== docId);

  // Update row first
  const { data, error: updErr } = await supabaseAdmin
    .from("clients")
    .update({ documents: nextDocs })
    .eq("id", id)
    .select("*")
    .single();
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Then remove from storage (best-effort)
  if (target?.storageKey) {
    await supabaseAdmin.storage.from(CLIENT_DOCS_BUCKET).remove([target.storageKey]);
  }

  return NextResponse.json(data);
}
