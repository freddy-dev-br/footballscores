import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCoachingAdvice, AiNotConfiguredError } from "@/lib/openai";

interface GoalRow {
  goal_type: string;
  target_calories: number | null;
  target_protein_g: number | null;
  target_steps: number | null;
  target_sleep_hours: number | null;
}
interface MealRow {
  description: string | null;
  calories: number | null;
  logged_at: string;
}
interface WorkoutRow {
  name: string;
  completed: number;
  scheduled_date: string;
}

export async function POST() {
  const db = getDb();
  const goal = db.prepare("SELECT * FROM goals WHERE id = 1").get() as GoalRow;

  const today = new Date().toISOString().slice(0, 10);
  const todayMeals = db
    .prepare("SELECT description, calories, logged_at FROM meals WHERE date(logged_at) = date(?)")
    .all(today) as MealRow[];
  const todayCaloriesSoFar = todayMeals.reduce((sum, m) => sum + (m.calories ?? 0), 0);

  const recentMeals = db
    .prepare("SELECT description, calories, logged_at FROM meals ORDER BY logged_at DESC LIMIT 5")
    .all() as MealRow[];
  const recentMealsSummary = recentMeals
    .map((m) => `${m.logged_at.slice(0, 10)}: ${m.description ?? "meal"} (${m.calories ?? "?"} kcal)`)
    .join("; ");

  const recentWorkouts = db
    .prepare("SELECT name, completed, scheduled_date FROM workouts ORDER BY scheduled_date DESC LIMIT 5")
    .all() as WorkoutRow[];
  const recentWorkoutsSummary = recentWorkouts
    .map((w) => `${w.scheduled_date}: ${w.name} (${w.completed ? "completed" : "not done"})`)
    .join("; ");

  const stepsRows = db.prepare("SELECT count FROM steps_log ORDER BY date DESC LIMIT 7").all() as { count: number }[];
  const recentStepsAvg = stepsRows.length
    ? Math.round(stepsRows.reduce((s, r) => s + r.count, 0) / stepsRows.length)
    : null;

  const sleepRows = db
    .prepare("SELECT duration_minutes FROM sleep_log ORDER BY date DESC LIMIT 7")
    .all() as { duration_minutes: number }[];
  const recentSleepAvgHours = sleepRows.length
    ? Math.round((sleepRows.reduce((s, r) => s + r.duration_minutes, 0) / sleepRows.length / 60) * 10) / 10
    : null;

  try {
    const advice = await getCoachingAdvice({
      goalType: goal.goal_type,
      targetCalories: goal.target_calories,
      targetProteinG: goal.target_protein_g,
      targetSteps: goal.target_steps,
      targetSleepHours: goal.target_sleep_hours,
      recentMealsSummary,
      recentWorkoutsSummary,
      recentStepsAvg,
      recentSleepAvgHours,
      todayCaloriesSoFar,
    });
    return NextResponse.json({ advice });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json({ error: err.message, code: "ai_not_configured" }, { status: 501 });
    }
    console.error("Coaching advice failed:", err);
    return NextResponse.json({ error: "Could not get advice right now.", code: "advice_failed" }, { status: 502 });
  }
}
