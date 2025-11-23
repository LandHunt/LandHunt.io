// app/api/clients/[id]/activity/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  const { id } = params;
  const body = await req.json(); // { type: 'note'|'email'|'call', text: string }

  // Get existing activity
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from("clients")
    .select("activity")
    .eq("id", id)
    .single();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 404 });

  const newItem = {
    id: randomUUID(),
    type: body.type,
    text: (body.text ?? "").toString(),
    at: new Date().toISOString(),
  };
  const nextActivity = [...(existing?.activity ?? []), newItem];

  const { data, error } = await supabaseAdmin
    .from("clients")
    .update({ activity: nextActivity })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
