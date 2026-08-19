import { NextRequest, NextResponse } from "next/server";
import { analyzeFoodPhoto, AiNotConfiguredError } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const imageDataUrl: string | undefined = body.image_data_url;
  const extraContext: string | undefined = body.extra_context;

  if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "image_data_url must be a data:image/... URL" }, { status: 400 });
  }

  try {
    const analysis = await analyzeFoodPhoto(imageDataUrl, extraContext);
    return NextResponse.json(analysis);
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json({ error: err.message, code: "ai_not_configured" }, { status: 501 });
    }
    console.error("Food photo analysis failed:", err);
    return NextResponse.json(
      { error: "Could not analyze this photo. Try again, or enter the meal manually.", code: "analysis_failed" },
      { status: 502 }
    );
  }
}
