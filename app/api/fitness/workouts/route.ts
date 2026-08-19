import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = getDb();
  const url = new URL(req.url);
  const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const rows = db.prepare(
    `SELECT * FROM workouts WHERE date(logged_at) = ? ORDER BY logged_at DESC`
  ).all(date);
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { type, name, duration_minutes, calories_burned, distance_km, notes } = body;
  const result = db.prepare(
    `INSERT INTO workouts (type, name, duration_minutes, calories_burned, distance_km, notes)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(type, name, duration_minutes, calories_burned, distance_km, notes);
  const row = db.prepare("SELECT * FROM workouts WHERE id = ?").get(result.lastInsertRowid);
  return Response.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
  db.prepare("DELETE FROM workouts WHERE id = ?").run(id);
  return Response.json({ ok: true });
}
