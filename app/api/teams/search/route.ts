import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const country = searchParams.get("country")?.trim() ?? "";
  const competition = searchParams.get("competition")?.trim() ?? "";

  if (!q && !country && !competition) {
    return NextResponse.json([]);
  }

  const db = getDb();
  const conditions: string[] = [];
  const params: Record<string, string> = {};

  if (q) {
    conditions.push("(LOWER(name) LIKE LOWER(@q) OR LOWER(short_name) LIKE LOWER(@q) OR LOWER(tla) LIKE LOWER(@q))");
    params.q = `%${q}%`;
  }
  if (country) {
    conditions.push("LOWER(country) LIKE LOWER(@country)");
    params.country = `%${country}%`;
  }
  if (competition) {
    conditions.push("LOWER(competition_name) LIKE LOWER(@competition)");
    params.competition = `%${competition}%`;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db.prepare(`SELECT * FROM teams ${where} LIMIT 30`).all(params);
  return NextResponse.json(rows);
}
