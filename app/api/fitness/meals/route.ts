import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = getDb();
  const url = new URL(req.url);
  const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const rows = db.prepare(
    `SELECT id, name, description, calories, protein_g, carbs_g, fat_g, ai_analysis, meal_type, logged_at
     FROM meals WHERE date(logged_at) = ? ORDER BY logged_at ASC`
  ).all(date);
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { name, description, calories, protein_g, carbs_g, fat_g, ai_analysis, photo_data, meal_type } = body;
  const result = db.prepare(
    `INSERT INTO meals (name, description, calories, protein_g, carbs_g, fat_g, ai_analysis, photo_data, meal_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(name, description, calories, protein_g, carbs_g, fat_g, ai_analysis, photo_data, meal_type || "snack");
  const row = db.prepare(
    "SELECT id, name, description, calories, protein_g, carbs_g, fat_g, ai_analysis, meal_type, logged_at FROM meals WHERE id = ?"
  ).get(result.lastInsertRowid);
  return Response.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
  db.prepare("DELETE FROM meals WHERE id = ?").run(id);
  return Response.json({ ok: true });
}
