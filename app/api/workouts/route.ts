import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = await getDb();
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

  const workoutsResult = await db.execute({ sql: query, args });
  const workouts = workoutsResult.rows as unknown as { id: number }[];

  const result = await Promise.all(
    workouts.map(async (w) => {
      const exercisesResult = await db.execute({
        sql: `SELECT we.*, e.name, e.category, e.muscle_group, e.equipment, e.video_search_query
              FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id
              WHERE we.workout_id = ? ORDER BY we.order_index ASC`,
        args: [w.id],
      });
      return { ...w, exercises: exercisesResult.rows };
    })
  );

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

  const db = await getDb();
  const now = new Date().toISOString();

  const tx = await db.transaction("write");
  let workoutId: bigint;
  try {
    const info = await tx.execute({
      sql: `INSERT INTO workouts (scheduled_date, name, goal_focus, notes, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [scheduled_date, name, goal_focus ?? null, notes ?? null, now],
    });
    workoutId = info.lastInsertRowid!;

    for (const [i, ex] of (exercises as Record<string, unknown>[]).entries()) {
      await tx.execute({
        sql: `INSERT INTO workout_exercises (workout_id, exercise_id, order_index, sets, reps, weight_kg, duration_seconds)
              VALUES (@workout_id, @exercise_id, @order_index, @sets, @reps, @weight_kg, @duration_seconds)`,
        args: {
          workout_id: workoutId,
          exercise_id: ex.exercise_id as number,
          order_index: i,
          sets: (ex.sets as number) ?? null,
          reps: (ex.reps as number) ?? null,
          weight_kg: (ex.weight_kg as number) ?? null,
          duration_seconds: (ex.duration_seconds as number) ?? null,
        },
      });
    }
    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }

  const result = await db.execute({ sql: "SELECT * FROM workouts WHERE id = ?", args: [workoutId] });
  return NextResponse.json(result.rows[0], { status: 201 });
}
