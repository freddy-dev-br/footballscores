import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const type = req.nextUrl.searchParams.get("type") ?? "fixtures";
  const db = getDb();

  const statusFilter =
    type === "results"
      ? `status IN ('FINISHED')`
      : `status IN ('SCHEDULED', 'TIMED', 'LIVE', 'IN_PLAY', 'PAUSED', 'POSTPONED')`;

  const order = type === "results" ? "DESC" : "ASC";

  const rows = db
    .prepare(
      `SELECT * FROM matches
       WHERE (home_team_id = ? OR away_team_id = ?)
         AND ${statusFilter}
       ORDER BY match_date ${order}
       LIMIT 20`
    )
    .all(teamId, teamId);

  return NextResponse.json(rows);
}
