import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = getDb();
  const url = new URL(req.url);
  const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const range = url.searchParams.get("range");

  if (range === "week") {
    const rows = db.prepare(
      `SELECT * FROM sleep_sessions WHERE date >= date(?, '-6 days') ORDER BY date ASC`
    ).all(date);
    return Response.json(rows);
  }

  const rows = db.prepare("SELECT * FROM sleep_sessions WHERE date = ? ORDER BY created_at DESC").all(date);
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { date, start_time, end_time, duration_minutes, quality, deep_sleep_minutes, rem_sleep_minutes, light_sleep_minutes, notes } = body;
  const d = date || new Date().toISOString().slice(0, 10);
  const result = db.prepare(
    `INSERT INTO sleep_sessions (date, start_time, end_time, duration_minutes, quality, deep_sleep_minutes, rem_sleep_minutes, light_sleep_minutes, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(d, start_time, end_time, duration_minutes, quality || "good", deep_sleep_minutes || 0, rem_sleep_minutes || 0, light_sleep_minutes || 0, notes);
  const row = db.prepare("SELECT * FROM sleep_sessions WHERE id = ?").get(result.lastInsertRowid);
  return Response.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
  db.prepare("DELETE FROM sleep_sessions WHERE id = ?").run(id);
  return Response.json({ ok: true });
}
