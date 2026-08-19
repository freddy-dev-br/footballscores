import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = getDb();
  const days = Number(req.nextUrl.searchParams.get("days") ?? 14);
  const rows = db
    .prepare(`SELECT * FROM sleep_log ORDER BY date DESC LIMIT ?`)
    .all(days);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, sleep_start, sleep_end, quality, source } = body;
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  let durationMinutes = body.duration_minutes;
  if (!durationMinutes && sleep_start && sleep_end) {
    durationMinutes = Math.round((new Date(sleep_end).getTime() - new Date(sleep_start).getTime()) / 60000);
  }
  if (!durationMinutes || durationMinutes <= 0) {
    return NextResponse.json({ error: "duration_minutes, or sleep_start+sleep_end, is required" }, { status: 400 });
  }

  const db = getDb();
  db.prepare(
    `INSERT INTO sleep_log (date, sleep_start, sleep_end, duration_minutes, quality, source, updated_at)
     VALUES (@date, @sleep_start, @sleep_end, @duration_minutes, @quality, @source, @updated_at)
     ON CONFLICT(date) DO UPDATE SET sleep_start = @sleep_start, sleep_end = @sleep_end, duration_minutes = @duration_minutes, quality = @quality, source = @source, updated_at = @updated_at`
  ).run({
    date,
    sleep_start: sleep_start ?? null,
    sleep_end: sleep_end ?? null,
    duration_minutes: durationMinutes,
    quality: quality ?? null,
    source: source ?? "manual",
    updated_at: new Date().toISOString(),
  });

  const row = db.prepare("SELECT * FROM sleep_log WHERE date = ?").get(date);
  return NextResponse.json(row);
}
