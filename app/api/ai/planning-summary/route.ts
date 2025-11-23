import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type PlanningSummary = {
  decision: string | null;
  summary: string;
  policies: string[];
  material_issues: string[];
  risks: string[];
  approval_probability: number | null;
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const url = body?.url as string | undefined;
    const rawText = body?.rawText as string | undefined;
    const parcelId = body?.parcelId as string | undefined;

    if (!url && !rawText) {
      return NextResponse.json(
        { error: "Either url or rawText is required" },
        { status: 400 }
      );
    }

    let sourceText = rawText ?? "";

    if (!sourceText && url) {
      const res = await fetch(url);
      if (!res.ok) {
        console.error("Failed to fetch planning URL", await res.text());
        return NextResponse.json(
          { error: "Could not fetch planning URL" },
          { status: 400 }
        );
      }
      const html = await res.text();
      // Ultra-simple HTML → text. Replace with better extraction later.
      sourceText = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    if (!sourceText) {
      return NextResponse.json(
        { error: "No text available to summarise" },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are a UK planning consultant.
Given the full text of a planning application / decision, extract a structured summary.

Return strict JSON with fields:
{
  "decision": "approved" | "refused" | "pending" | "unknown",
  "summary": "2-3 sentence overview",
  "policies": ["list of key local/national policies referenced"],
  "material_issues": ["list of main material planning considerations"],
  "risks": ["list of risks / reasons for refusal / potential grounds for challenge"],
  "approval_probability": number between 0 and 1 or null if not applicable
}

Do not include any commentary outside JSON.
`;

    const userPrompt = `
Here is the planning text:

${sourceText.slice(0, 12000)} 
(Truncated if very long)
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("No content from OpenAI");
    }

    let parsed: PlanningSummary;
    try {
      parsed = JSON.parse(raw) as PlanningSummary;
    } catch (err) {
      console.error("Failed to parse planning summary JSON:", err, raw);
      return NextResponse.json(
        { error: "AI returned invalid JSON", raw },
        { status: 500 }
      );
    }

    const cleaned: PlanningSummary = {
      decision: parsed.decision ?? "unknown",
      summary: parsed.summary ?? "",
      policies: Array.isArray(parsed.policies) ? parsed.policies : [],
      material_issues: Array.isArray(parsed.material_issues)
        ? parsed.material_issues
        : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      approval_probability:
        typeof parsed.approval_probability === "number"
          ? Math.min(1, Math.max(0, parsed.approval_probability))
          : null,
    };

    // Optionally persist in planning_summaries
    if (parcelId || url) {
      const { error: upsertError } = await supabase
        .from("planning_summaries")
        .upsert(
          {
            parcel_id: parcelId ?? null,
            source_url: url ?? null,
            summary: cleaned.summary,
            decision: cleaned.decision,
            policies: cleaned.policies,
            material_issues: cleaned.material_issues,
            risks: cleaned.risks,
            approval_probability: cleaned.approval_probability,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: parcelId ? "parcel_id" : "source_url",
          }
        );

      if (upsertError) {
        console.error("Failed to upsert planning_summaries", upsertError);
      }
    }

    return NextResponse.json(cleaned);
  } catch (err) {
    console.error("planning-summary error", err);
    return NextResponse.json(
      { error: "Internal error summarising planning" },
      { status: 500 }
    );
  }
}
