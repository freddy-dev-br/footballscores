import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const profile = db.prepare("SELECT * FROM fitness_profile ORDER BY id LIMIT 1").get();
  if (!profile) {
    const defaultProfile = {
      id: 1, name: "User", age: null, weight_kg: null, height_cm: null,
      goal: "maintenance", daily_calorie_target: 2000,
      daily_step_target: 10000, sleep_target_hours: 8.0,
    };
    db.prepare(`INSERT OR IGNORE INTO fitness_profile (id, name, goal, daily_calorie_target, daily_step_target, sleep_target_hours)
      VALUES (1, 'User', 'maintenance', 2000, 10000, 8.0)`).run();
    return Response.json(defaultProfile);
  }
  return Response.json(profile);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { name, age, weight_kg, height_cm, goal, daily_calorie_target, daily_step_target, sleep_target_hours } = body;

  const existing = db.prepare("SELECT id FROM fitness_profile LIMIT 1").get() as { id: number } | undefined;
  if (existing) {
    db.prepare(`UPDATE fitness_profile SET
      name = ?, age = ?, weight_kg = ?, height_cm = ?, goal = ?,
      daily_calorie_target = ?, daily_step_target = ?, sleep_target_hours = ?,
      updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(name, age, weight_kg, height_cm, goal, daily_calorie_target, daily_step_target, sleep_target_hours, existing.id);
  } else {
    db.prepare(`INSERT INTO fitness_profile (name, age, weight_kg, height_cm, goal, daily_calorie_target, daily_step_target, sleep_target_hours)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(name, age, weight_kg, height_cm, goal, daily_calorie_target, daily_step_target, sleep_target_hours);
  }
  return Response.json({ ok: true });
}
