import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Parcel = {
  id: string;
  address: string | null;
  area_sq_m?: number | null;
  use_class?: string | null;
  local_plan_designation?: string | null;
  flood_zone?: string | null;
  constraints?: any;
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

    // 1) Load parcel
    const { data: parcel, error: parcelError } = await supabase
      .from("parcels")
      .select(
        "id, address, area_sq_m, use_class, local_plan_designation, flood_zone, constraints"
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

    // 2) Load AI scores + planning summary + comps if available
    const [{ data: scoresRow }, { data: planningRow }] = await Promise.all([
      supabase
        .from("parcel_ai_scores")
        .select("scores")
        .eq("parcel_id", parcel.id)
        .maybeSingle(),
      supabase
        .from("planning_summaries")
        .select("summary, decision, risks, approval_probability")
        .eq("parcel_id", parcel.id)
        .maybeSingle(),
    ]);

    const aiScores = scoresRow?.scores ?? null;
    const planningSummary = planningRow ?? null;

    // 3) Optional: have AI draft a short feasibility narrative
    let aiNarrative = "";
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a UK land analyst. Write a concise, professional feasibility summary (max 200 words).",
          },
          {
            role: "user",
            content: `Parcel data:\n${JSON.stringify(
              parcel,
              null,
              2
            )}\n\nAI scores:\n${JSON.stringify(
              aiScores,
              null,
              2
            )}\n\nPlanning summary:\n${JSON.stringify(planningSummary, null, 2)}`,
          },
        ],
        temperature: 0.4,
      });

      aiNarrative = completion.choices[0]?.message?.content ?? "";
    } catch (err) {
      console.error("AI narrative failed, continuing without it", err);
    }

    // 4) Build PDF in memory
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 portrait
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 40;
    let y = 800;

    const drawHeading = (text: string) => {
      page.drawText(text, {
        x: margin,
        y,
        size: 16,
        font: fontBold,
        color: rgb(0.17, 0.34, 0.67),
      });
      y -= 24;
    };

    const drawSubheading = (text: string) => {
      page.drawText(text, {
        x: margin,
        y,
        size: 12,
        font: fontBold,
        color: rgb(0.9, 0.9, 0.9),
      });
      y -= 18;
    };

    const drawParagraph = (text: string, size = 11) => {
      const maxWidth = 595 - margin * 2;
      const lines = wrapText(text, size, font, maxWidth);
      for (const line of lines) {
        page.drawText(line, {
          x: margin,
          y,
          size,
          font,
          color: rgb(0.95, 0.95, 0.95),
        });
        y -= size + 2;
      }
      y -= 6;
    };

    // Background-ish
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 595,
      height: 842,
      color: rgb(0.02, 0.06, 0.1),
    });

    // Title
    drawHeading("Landhunt – Digital Site Passport");
    drawParagraph(
      parcel.address || `Parcel ID: ${parcel.id}`,
      12
    );

    // Parcel basics
    drawSubheading("1. Parcel Summary");
    drawParagraph(
      [
        parcel.address && `Address: ${parcel.address}`,
        parcel.area_sq_m && `Area: ${parcel.area_sq_m.toFixed(0)} m²`,
        parcel.use_class && `Use class: ${parcel.use_class}`,
        parcel.local_plan_designation &&
          `Local plan designation: ${parcel.local_plan_designation}`,
        parcel.flood_zone && `Flood zone: ${parcel.flood_zone}`,
      ]
        .filter(Boolean)
        .join("\n")
    );

    // AI scores
    if (aiScores) {
      drawSubheading("2. AI Suitability Scores");
      const scoreLines = [
        `Development potential: ${aiScores.development_potential ?? "–"} / 100`,
        `Planning probability: ${aiScores.planning_probability ?? "–"} / 100`,
        `Access quality: ${aiScores.access_quality ?? "–"} / 100`,
        `Constraint severity: ${aiScores.constraint_severity ?? "–"} / 100`,
        `Marketability: ${aiScores.marketability ?? "–"} / 100`,
        `Density potential: ${aiScores.density_potential ?? "–"} / 100`,
        `Recommended use: ${aiScores.recommended_use ?? "–"}`,
      ].join("\n");
      drawParagraph(scoreLines);
      if (aiScores.rationale) {
        drawParagraph(`Rationale: ${aiScores.rationale}`);
      }
    }

    // Planning summary
    if (planningSummary) {
      drawSubheading("3. Planning Summary");
      const parts: string[] = [];
      if (planningSummary.decision) {
        parts.push(`Decision: ${planningSummary.decision}`);
      }
      if (typeof planningSummary.approval_probability === "number") {
        parts.push(
          `Estimated approval probability: ${
            Math.round(planningSummary.approval_probability * 100) ?? "–"
          }%`
        );
      }
      if (planningSummary.summary) {
        parts.push(`Summary: ${planningSummary.summary}`);
      }
      if (Array.isArray(planningSummary.risks)) {
        parts.push(`Key risks: ${planningSummary.risks.join(", ")}`);
      }
      drawParagraph(parts.join("\n"));
    }

    // AI feasibility narrative
    if (aiNarrative) {
      drawSubheading("4. AI Feasibility Commentary");
      drawParagraph(aiNarrative);
    }

    // TODO sections: Topography, Flood risk maps, Constraints, Comps, Photos
    drawSubheading("5. Additional Layers (beta)");
    drawParagraph(
      "Topography, detailed constraints, comparables and site photography can be added here as you connect more data sources."
    );

    const pdfBytes = await pdfDoc.save();

    // 5) Upload to Supabase Storage
    const fileName = `site-passports/${parcel.id}/${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload passport PDF", uploadError);
      return NextResponse.json(
        { error: "PDF upload failed" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(fileName);

    // 6) Save reference in parcel_passports
    const { error: passportError } = await supabase.from("parcel_passports").insert(
      {
        parcel_id: parcel.id,
        file_path: uploadData?.path,
        url: publicUrl,
        created_at: new Date().toISOString(),
      }
    );

    if (passportError) {
      console.error("Failed to insert parcel_passports", passportError);
    }

    return NextResponse.json({
      parcelId: parcel.id,
      url: publicUrl,
    });
  } catch (err) {
    console.error("passport generate error", err);
    return NextResponse.json(
      { error: "Internal error generating passport" },
      { status: 500 }
    );
  }
}

// Small helper to wrap text naïvely
function wrapText(
  text: string,
  fontSize: number,
  font: any,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    const width = font.widthOfTextAtSize(test, fontSize);
    if (width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}
