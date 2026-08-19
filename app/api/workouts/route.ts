import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = getDb();
  const from = req.nextUrl.searchParams.get("from");
  const upcoming = req.nextUrl.searchParams.get("upcoming") === "1";

  let query = "SELECT * FROM workouts WHERE 1=1";
  const args: string[] = [];
  if (from) {
    query += " AND scheduled_date >= ?";
    args.push(from);
  }
  if (upcoming) {
    query += " AND completed = 0";
  }
  query += " ORDER BY scheduled_date ASC";

  const workouts = db.prepare(query).all(...args) as { id: number }[];
  const exerciseStmt = db.prepare(
    `SELECT we.*, e.name, e.category, e.muscle_group, e.equipment, e.video_search_query
     FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id
     WHERE we.workout_id = ? ORDER BY we.order_index ASC`
  );

  const result = workouts.map((w) => ({ ...w, exercises: exerciseStmt.all(w.id) }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { scheduled_date, name, goal_focus, notes, exercises } = body;
  if (!scheduled_date || !name || !Array.isArray(exercises) || exercises.length === 0) {
    return NextResponse.json(
      { error: "scheduled_date, name, and a non-empty exercises array are required" },
      { status: 400 }
    );
  }

  const db = getDb();
  const now = new Date().toISOString();

  const insertWorkout = db.prepare(
    `INSERT INTO workouts (scheduled_date, name, goal_focus, notes, created_at) VALUES (?, ?, ?, ?, ?)`
  );
  const insertExercise = db.prepare(
    `INSERT INTO workout_exercises (workout_id, exercise_id, order_index, sets, reps, weight_kg, duration_seconds)
     VALUES (@workout_id, @exercise_id, @order_index, @sets, @reps, @weight_kg, @duration_seconds)`
  );

  const workoutId = db.transaction(() => {
    const info = insertWorkout.run(scheduled_date, name, goal_focus ?? null, notes ?? null, now);
    const id = info.lastInsertRowid;
    exercises.forEach((ex: Record<string, unknown>, i: number) => {
      insertExercise.run({
        workout_id: id,
        exercise_id: ex.exercise_id,
        order_index: i,
        sets: ex.sets ?? null,
        reps: ex.reps ?? null,
        weight_kg: ex.weight_kg ?? null,
        duration_seconds: ex.duration_seconds ?? null,
      });
    });
    return id;
  })();

  const workout = db.prepare("SELECT * FROM workouts WHERE id = ?").get(workoutId);
  return NextResponse.json(workout, { status: 201 });
}
