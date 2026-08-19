import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const now = new Date();
  const month =
    searchParams.get("month") ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [year, mon] = month.split("-").map(Number);
  const startDate = `${month}-01`;
  const lastDay = new Date(year, mon, 0).getDate();
  const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM matches
       WHERE DATE(match_date) >= ? AND DATE(match_date) <= ?
       ORDER BY match_date ASC`
    )
    .all(startDate, endDate);

  const grouped: Record<string, unknown[]> = {};
  for (const row of rows) {
    const date = (row as { match_date: string }).match_date.slice(0, 10);
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(row);
  }

  return NextResponse.json(grouped);
}
