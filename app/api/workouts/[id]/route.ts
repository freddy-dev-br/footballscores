import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const workoutResult = await db.execute({ sql: "SELECT * FROM workouts WHERE id = ?", args: [id] });
  const workout = workoutResult.rows[0];
  if (!workout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const exercisesResult = await db.execute({
    sql: `SELECT we.*, e.name, e.category, e.muscle_group, e.equipment, e.instructions, e.video_search_query
          FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id
          WHERE we.workout_id = ? ORDER BY we.order_index ASC`,
    args: [id],
  });

  return NextResponse.json({ ...workout, exercises: exercisesResult.rows });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const db = await getDb();

  if (body.completed !== undefined) {
    await db.execute({
      sql: "UPDATE workouts SET completed = ?, completed_at = ? WHERE id = ?",
      args: [body.completed ? 1 : 0, body.completed ? new Date().toISOString() : null, id],
    });
  }

  if (Array.isArray(body.exercise_updates)) {
    await db.batch(
      (body.exercise_updates as Record<string, unknown>[]).map((u) => ({
        sql: `UPDATE workout_exercises SET sets = @sets, reps = @reps, weight_kg = @weight_kg, completed = @completed WHERE id = @id AND workout_id = @workout_id`,
        args: {
          id: u.id as number,
          workout_id: id,
          sets: (u.sets as number) ?? null,
          reps: (u.reps as number) ?? null,
          weight_kg: (u.weight_kg as number) ?? null,
          completed: u.completed ? 1 : 0,
        },
      })),
      "write"
    );
  }

  const result = await db.execute({ sql: "SELECT * FROM workouts WHERE id = ?", args: [id] });
  return NextResponse.json(result.rows[0]);
}
