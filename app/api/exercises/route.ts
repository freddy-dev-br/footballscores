import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = await getDb();
  const category = req.nextUrl.searchParams.get("category");
  const muscleGroup = req.nextUrl.searchParams.get("muscle_group");

  let query = "SELECT * FROM exercises WHERE 1=1";
  const args: string[] = [];
  if (category) {
    query += " AND category = ?";
    args.push(category);
  }
  if (muscleGroup) {
    query += " AND muscle_group = ?";
    args.push(muscleGroup);
  }
  query += " ORDER BY name ASC";

  const result = await db.execute({ sql: query, args });
  return NextResponse.json(result.rows);
}
