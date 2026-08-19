import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const workout = db.prepare("SELECT * FROM workouts WHERE id = ?").get(id);
  if (!workout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const exercises = db
    .prepare(
      `SELECT we.*, e.name, e.category, e.muscle_group, e.equipment, e.instructions, e.video_search_query
       FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id
       WHERE we.workout_id = ? ORDER BY we.order_index ASC`
    )
    .all(id);

  return NextResponse.json({ ...workout, exercises });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  if (body.completed !== undefined) {
    db.prepare("UPDATE workouts SET completed = ?, completed_at = ? WHERE id = ?").run(
      body.completed ? 1 : 0,
      body.completed ? new Date().toISOString() : null,
      id
    );
  }

  if (Array.isArray(body.exercise_updates)) {
    const update = db.prepare(
      `UPDATE workout_exercises SET sets = @sets, reps = @reps, weight_kg = @weight_kg, completed = @completed WHERE id = @id AND workout_id = @workout_id`
    );
    const tx = db.transaction((updates: Record<string, unknown>[]) => {
      for (const u of updates) {
        update.run({
          id: u.id,
          workout_id: id,
          sets: u.sets ?? null,
          reps: u.reps ?? null,
          weight_kg: u.weight_kg ?? null,
          completed: u.completed ? 1 : 0,
        });
      }
    });
    tx(body.exercise_updates);
  }

  const workout = db.prepare("SELECT * FROM workouts WHERE id = ?").get(id);
  return NextResponse.json(workout);
}
