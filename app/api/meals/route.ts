import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = await getDb();
  const date = req.nextUrl.searchParams.get("date");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 50);

  const result = date
    ? await db.execute({
        sql: `SELECT id, logged_at, meal_type, description, calories, protein_g, carbs_g, fat_g, confidence, needs_more_info, clarifying_question, ai_notes
              FROM meals WHERE date(logged_at) = date(?) ORDER BY logged_at DESC`,
        args: [date],
      })
    : await db.execute({
        sql: `SELECT id, logged_at, meal_type, description, calories, protein_g, carbs_g, fat_g, confidence, needs_more_info, clarifying_question, ai_notes
              FROM meals ORDER BY logged_at DESC LIMIT ?`,
        args: [limit],
      });

  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = await getDb();

  const now = new Date().toISOString();
  const info = await db.execute({
    sql: `INSERT INTO meals
        (logged_at, meal_type, photo_data, description, calories, protein_g, carbs_g, fat_g, confidence, needs_more_info, clarifying_question, ai_notes, raw_analysis, created_at)
       VALUES (@logged_at, @meal_type, @photo_data, @description, @calories, @protein_g, @carbs_g, @fat_g, @confidence, @needs_more_info, @clarifying_question, @ai_notes, @raw_analysis, @created_at)`,
    args: {
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
    },
  });

  const result = await db.execute({
    sql: "SELECT * FROM meals WHERE id = ?",
    args: [info.lastInsertRowid!],
  });
  return NextResponse.json(result.rows[0], { status: 201 });
}
