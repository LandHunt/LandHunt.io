import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // SERVER ONLY
);

type Parcel = {
  id: string;
  address: string | null;
  area_sq_m?: number | null;
  use_class?: string | null;
  local_plan_designation?: string | null;
  flood_zone?: string | null;
  constraints?: any; // JSONB in Supabase
  ppd_snapshot?: any; // e.g. recent comps you might pre-store
};

type ParcelAIScores = {
  development_potential: number;
  planning_probability: number;
  access_quality: number;
  constraint_severity: number;
  marketability: number;
  density_potential: number;
  recommended_use: string;
  rationale: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parcelId = body?.parcelId as string | undefined;

    if (!parcelId) {
      return NextResponse.json(
        { error: "parcelId is required" },
        { status: 400 }
      );
    }

    // 1) Load parcel + any precomputed context from Supabase
    const { data: parcel, error: parcelError } = await supabase
      .from("parcels")
      .select(
        "id, address, area_sq_m, use_class, local_plan_designation, flood_zone, constraints, ppd_snapshot"
      )
      .eq("id", parcelId)
      .single<Parcel>();

    if (parcelError || !parcel) {
      console.error(parcelError);
      return NextResponse.json(
        { error: "Parcel not found" },
        { status: 404 }
      );
    }

    // 2) Call OpenAI to generate scores
    const context = {
      id: parcel.id,
      address: parcel.address,
      area_sq_m: parcel.area_sq_m,
      use_class: parcel.use_class,
      local_plan_designation: parcel.local_plan_designation,
      flood_zone: parcel.flood_zone,
      constraints: parcel.constraints,
      ppd_snapshot: parcel.ppd_snapshot,
    };

    const systemPrompt = `
You are a UK land and planning analyst for Huntsland (Landhunt). 
Given factual parcel data, you MUST output a single JSON object with numeric scores between 0 and 100, 
plus a recommended use and a short rationale.

Scores:
- development_potential (0-100)
- planning_probability (0-100)
- access_quality (0-100)
- constraint_severity (0-100, where higher = more severe constraints)
- marketability (0-100)
- density_potential (approx units per hectare, treat as 0-100 scale)
- recommended_use (string: e.g. "medium-density residential", "logistics", "care home", "light industrial")
- rationale (2-3 sentence explanation)

If data is missing, infer cautiously but still provide a numeric score.
Return ONLY valid JSON – no commentary.`;

    const userPrompt = `
Here is the parcel data (JSON):

${JSON.stringify(context, null, 2)}

Return a JSON object like:
{
  "development_potential": 0-100,
  "planning_probability": 0-100,
  "access_quality": 0-100,
  "constraint_severity": 0-100,
  "marketability": 0-100,
  "density_potential": 0-100,
  "recommended_use": "string",
  "rationale": "string"
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("No content from OpenAI");
    }

    let scores: ParcelAIScores;
    try {
      scores = JSON.parse(raw) as ParcelAIScores;
    } catch (err) {
      console.error("Failed to parse AI scores JSON:", err, raw);
      return NextResponse.json(
        { error: "AI returned invalid JSON", raw },
        { status: 500 }
      );
    }

    // Clamp numeric scores between 0-100
    const clamp = (n: any) =>
      Math.max(0, Math.min(100, Number.isFinite(n) ? Number(n) : 0));

    const cleaned: ParcelAIScores = {
      development_potential: clamp(scores.development_potential),
      planning_probability: clamp(scores.planning_probability),
      access_quality: clamp(scores.access_quality),
      constraint_severity: clamp(scores.constraint_severity),
      marketability: clamp(scores.marketability),
      density_potential: clamp(scores.density_potential),
      recommended_use: scores.recommended_use ?? "unspecified",
      rationale: scores.rationale ?? "",
    };

    // 3) Upsert into parcel_ai_scores
    const { error: upsertError } = await supabase.from("parcel_ai_scores").upsert(
      {
        parcel_id: parcel.id,
        scores: cleaned,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "parcel_id",
      }
    );

    if (upsertError) {
      console.error("Failed to upsert parcel_ai_scores:", upsertError);
    }

    return NextResponse.json({
      parcelId: parcel.id,
      scores: cleaned,
    });
  } catch (err) {
    console.error("score-parcel error", err);
    return NextResponse.json(
      { error: "Internal error scoring parcel" },
      { status: 500 }
    );
  }
}
