import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = getDb();
  const date = req.nextUrl.searchParams.get("date");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 50);

  const rows = date
    ? db
        .prepare(
          `SELECT id, logged_at, meal_type, description, calories, protein_g, carbs_g, fat_g, confidence, needs_more_info, clarifying_question, ai_notes
           FROM meals WHERE date(logged_at) = date(?) ORDER BY logged_at DESC`
        )
        .all(date)
    : db
        .prepare(
          `SELECT id, logged_at, meal_type, description, calories, protein_g, carbs_g, fat_g, confidence, needs_more_info, clarifying_question, ai_notes
           FROM meals ORDER BY logged_at DESC LIMIT ?`
        )
        .all(limit);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = getDb();

  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO meals
        (logged_at, meal_type, photo_data, description, calories, protein_g, carbs_g, fat_g, confidence, needs_more_info, clarifying_question, ai_notes, raw_analysis, created_at)
       VALUES (@logged_at, @meal_type, @photo_data, @description, @calories, @protein_g, @carbs_g, @fat_g, @confidence, @needs_more_info, @clarifying_question, @ai_notes, @raw_analysis, @created_at)`
    )
    .run({
      logged_at: body.logged_at ?? now,
      meal_type: body.meal_type ?? null,
      photo_data: body.photo_data ?? null,
      description: body.description ?? null,
      calories: body.calories ?? null,
      protein_g: body.protein_g ?? null,
      carbs_g: body.carbs_g ?? null,
      fat_g: body.fat_g ?? null,
      confidence: body.confidence ?? null,
      needs_more_info: body.needs_more_info ? 1 : 0,
      clarifying_question: body.clarifying_question ?? null,
      ai_notes: body.ai_notes ?? null,
      raw_analysis: body.raw_analysis ? JSON.stringify(body.raw_analysis) : null,
      created_at: now,
    });

  const meal = db.prepare("SELECT * FROM meals WHERE id = ?").get(info.lastInsertRowid);
  return NextResponse.json(meal, { status: 201 });
}
