import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = getDb();
  const url = new URL(req.url);
  const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const range = url.searchParams.get("range");

  if (range === "week") {
    const rows = db.prepare(
      `SELECT * FROM daily_steps WHERE date >= date(?, '-6 days') ORDER BY date ASC`
    ).all(date);
    return Response.json(rows);
  }

  let row = db.prepare("SELECT * FROM daily_steps WHERE date = ?").get(date);
  if (!row) {
    db.prepare("INSERT OR IGNORE INTO daily_steps (date, steps, distance_km, calories_burned) VALUES (?, 0, 0, 0)").run(date);
    row = db.prepare("SELECT * FROM daily_steps WHERE date = ?").get(date);
  }
  return Response.json(row);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { date, steps, distance_km, calories_burned } = body;
  const d = date || new Date().toISOString().slice(0, 10);
  db.prepare(
    `INSERT INTO daily_steps (date, steps, distance_km, calories_burned)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       steps = excluded.steps,
       distance_km = excluded.distance_km,
       calories_burned = excluded.calories_burned,
       updated_at = CURRENT_TIMESTAMP`
  ).run(d, steps, distance_km || 0, calories_burned || 0);
  const row = db.prepare("SELECT * FROM daily_steps WHERE date = ?").get(d);
  return Response.json(row);
}
