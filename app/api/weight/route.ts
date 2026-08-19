import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = await getDb();
  const days = Number(req.nextUrl.searchParams.get("days") ?? 90);
  const result = await db.execute({
    sql: `SELECT * FROM body_weight ORDER BY date DESC LIMIT ?`,
    args: [days],
  });
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, weight_kg } = body;
  if (!date || typeof weight_kg !== "number") {
    return NextResponse.json({ error: "date and weight_kg are required" }, { status: 400 });
  }
  const db = await getDb();
  await db.execute({
    sql: `INSERT INTO body_weight (date, weight_kg, updated_at) VALUES (@date, @weight_kg, @updated_at)
     ON CONFLICT(date) DO UPDATE SET weight_kg = @weight_kg, updated_at = @updated_at`,
    args: { date, weight_kg, updated_at: new Date().toISOString() },
  });
  const result = await db.execute({ sql: "SELECT * FROM body_weight WHERE date = ?", args: [date] });
  return NextResponse.json(result.rows[0]);
}
