import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "@/lib/db";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { context } = body;

  const today = new Date().toISOString().slice(0, 10);

  const profile = db.prepare("SELECT * FROM fitness_profile ORDER BY id LIMIT 1").get() as Record<string, unknown> | undefined;
  const todaySteps = db.prepare("SELECT * FROM daily_steps WHERE date = ?").get(today) as Record<string, unknown> | undefined;
  const todayMeals = db.prepare(
    "SELECT name, calories, protein_g, carbs_g, fat_g, meal_type FROM meals WHERE date(logged_at) = ?"
  ).all(today) as Record<string, unknown>[];
  const todayWorkouts = db.prepare(
    "SELECT type, name, duration_minutes, calories_burned FROM workouts WHERE date(logged_at) = ?"
  ).all(today) as Record<string, unknown>[];
  const recentSleep = db.prepare(
    "SELECT * FROM sleep_sessions WHERE date >= date(?, '-3 days') ORDER BY date DESC LIMIT 3"
  ).all(today) as Record<string, unknown>[];

  const totalCalories = todayMeals.reduce((sum, m) => sum + ((m.calories as number) || 0), 0);
  const totalProtein = todayMeals.reduce((sum, m) => sum + ((m.protein_g as number) || 0), 0);

  const systemPrompt = `You are an expert personal fitness and nutrition coach. You give concise, actionable, encouraging advice tailored to the user's data. Keep responses to 2-3 sentences max. Be specific and personal.`;

  const userPrompt = `Here is my current fitness data for today (${today}):

Profile: ${JSON.stringify(profile || { goal: "maintenance", daily_calorie_target: 2000, daily_step_target: 10000 })}
Steps today: ${todaySteps ? todaySteps.steps : 0} / ${profile?.daily_step_target || 10000} target
Calories today: ${totalCalories} kcal consumed, ${profile?.daily_calorie_target || 2000} kcal target
Protein today: ${totalProtein}g
Meals today: ${todayMeals.length > 0 ? todayMeals.map((m) => m.name).join(", ") : "None logged"}
Workouts today: ${todayWorkouts.length > 0 ? todayWorkouts.map((w) => `${w.name} (${w.duration_minutes} min)`).join(", ") : "None"}
Recent sleep: ${recentSleep.length > 0 ? recentSleep.map((s) => `${s.date}: ${Math.round(((s.duration_minutes as number) || 0) / 60 * 10) / 10}h (${s.quality})`).join(", ") : "No data"}

${context ? `User question: ${context}` : "Give me personalized advice for today based on my data."}`;

  const stream = await client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 256,
    thinking: { type: "adaptive" },
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const message = await stream.finalMessage();
  const textContent = message.content.find((c) => c.type === "text");

  return Response.json({
    advice: textContent?.type === "text" ? textContent.text : "Keep up the great work! Stay consistent with your goals.",
  });
}
