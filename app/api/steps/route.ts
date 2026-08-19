import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = await getDb();
  const days = Number(req.nextUrl.searchParams.get("days") ?? 14);
  const result = await db.execute({
    sql: `SELECT * FROM steps_log ORDER BY date DESC LIMIT ?`,
    args: [days],
  });
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, count, source } = body;
  if (!date || typeof count !== "number") {
    return NextResponse.json({ error: "date and count are required" }, { status: 400 });
  }
  const db = await getDb();
  await db.execute({
    sql: `INSERT INTO steps_log (date, count, source, updated_at) VALUES (@date, @count, @source, @updated_at)
     ON CONFLICT(date) DO UPDATE SET count = @count, source = @source, updated_at = @updated_at`,
    args: { date, count, source: source ?? "manual", updated_at: new Date().toISOString() },
  });

  const result = await db.execute({ sql: "SELECT * FROM steps_log WHERE date = ?", args: [date] });
  return NextResponse.json(result.rows[0]);
}
