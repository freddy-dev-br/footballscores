import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
  });
}
