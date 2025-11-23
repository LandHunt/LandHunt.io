import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const radius_m = parseInt(searchParams.get("radius_m") || "200", 10);
  const limit = parseInt(searchParams.get("limit") || "8", 10);

  const { data, error } = await supabase.rpc("ppd_near", {
    p_lat: lat,
    p_lon: lng,
    radius_m,
  });

  if (error) {
    console.error("ppd_near RPC error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  const rows = Array.isArray(data) ? data.slice(0, limit) : [];

  // 👈 IMPORTANT: wrap in { data: ... }
  return NextResponse.json({ data: rows });
}
