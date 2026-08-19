import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const goal = db.prepare("SELECT * FROM goals WHERE id = 1").get();
  return NextResponse.json(goal);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const db = getDb();

  db.prepare(
    `UPDATE goals SET
      goal_type = @goal_type,
      target_calories = @target_calories,
      target_protein_g = @target_protein_g,
      target_carbs_g = @target_carbs_g,
      target_fat_g = @target_fat_g,
      target_steps = @target_steps,
      target_sleep_hours = @target_sleep_hours,
      target_workouts_per_week = @target_workouts_per_week,
      notes = @notes,
      updated_at = @updated_at
     WHERE id = 1`
  ).run({
    goal_type: body.goal_type ?? "maintenance",
    target_calories: body.target_calories ?? null,
    target_protein_g: body.target_protein_g ?? null,
    target_carbs_g: body.target_carbs_g ?? null,
    target_fat_g: body.target_fat_g ?? null,
    target_steps: body.target_steps ?? null,
    target_sleep_hours: body.target_sleep_hours ?? null,
    target_workouts_per_week: body.target_workouts_per_week ?? null,
    notes: body.notes ?? null,
    updated_at: new Date().toISOString(),
  });

  const goal = db.prepare("SELECT * FROM goals WHERE id = 1").get();
  return NextResponse.json(goal);
}
