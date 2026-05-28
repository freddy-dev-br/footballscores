import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM matches
       WHERE status IN ('LIVE', 'IN_PLAY', 'PAUSED')
       ORDER BY match_date ASC`
    )
    .all();
  return NextResponse.json(rows);
}
