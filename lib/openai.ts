const CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new AiNotConfiguredError();
  }
  return key;
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not set. Add it to .env.local to enable AI food analysis and coaching advice.");
    this.name = "AiNotConfiguredError";
  }
}

export interface FoodAnalysis {
  items: { name: string; quantity_estimate: string }[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number; // 0-1
  needs_more_info: boolean;
  clarifying_question: string | null;
  notes: string;
}

const FOOD_ANALYSIS_SCHEMA_PROMPT = `You are a nutrition estimation assistant. Look at the food photo and estimate its nutritional content.

Respond with ONLY a JSON object matching this exact shape, no markdown fences, no commentary:
{
  "items": [{"name": string, "quantity_estimate": string}],
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "confidence": number between 0 and 1,
  "needs_more_info": boolean,
  "clarifying_question": string or null,
  "notes": string
}

Rules:
- confidence should reflect how certain you can be from the image alone (portion size, hidden ingredients like oil/dressing/sauce, and occlusion all lower it).
- If confidence is below 0.6, OR portion size is ambiguous, OR key ingredients could be hidden (e.g. a sauce, a stir-fry, a casserole, a smoothie), set needs_more_info to true and ask ONE specific, short clarifying question in clarifying_question (e.g. "About how many cups/grams, and was any oil or dressing added?"). Otherwise set needs_more_info to false and clarifying_question to null.
- notes should be a one-sentence caveat about assumptions made (e.g. "assumed 1 tbsp olive oil, grilled not fried").
- Numbers are your best point estimate, not a range.`;

async function callChatCompletions(body: Record<string, unknown>) {
  const key = getApiKey();
  const res = await fetch(CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI API error ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.json();
}

function extractJson(content: string): unknown {
  const cleaned = content.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

export async function analyzeFoodPhoto(imageDataUrl: string, extraContext?: string): Promise<FoodAnalysis> {
  const model = process.env.OPENAI_VISION_MODEL || "gpt-4o";

  const userText = extraContext
    ? `Additional context from the user about this meal: "${extraContext}". Use it to refine your estimate and lower/raise confidence accordingly.`
    : "Analyze this meal photo.";

  const data = await callChatCompletions({
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: FOOD_ANALYSIS_SCHEMA_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
  });

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI response had no content");

  const parsed = extractJson(content) as FoodAnalysis;
  return parsed;
}

export interface CoachContext {
  goalType: string;
  targetCalories: number | null;
  targetProteinG: number | null;
  targetSteps: number | null;
  targetSleepHours: number | null;
  recentMealsSummary: string;
  recentWorkoutsSummary: string;
  recentStepsAvg: number | null;
  recentSleepAvgHours: number | null;
  todayCaloriesSoFar: number;
}

export async function getCoachingAdvice(ctx: CoachContext): Promise<string> {
  const model = process.env.OPENAI_TEXT_MODEL || "gpt-4o";

  const prompt = `You are a supportive fitness and nutrition coach. Give short, specific, encouraging advice (max 120 words, plain text, no markdown headers) for today based on this data:

Goal: ${ctx.goalType}
Calorie target: ${ctx.targetCalories ?? "not set"} kcal/day (consumed so far today: ${ctx.todayCaloriesSoFar} kcal)
Protein target: ${ctx.targetProteinG ?? "not set"} g/day
Step target: ${ctx.targetSteps ?? "not set"} steps/day (recent average: ${ctx.recentStepsAvg ?? "no data"})
Sleep target: ${ctx.targetSleepHours ?? "not set"} h/night (recent average: ${ctx.recentSleepAvgHours ?? "no data"})

Recent meals: ${ctx.recentMealsSummary || "no meals logged recently"}
Recent workouts: ${ctx.recentWorkoutsSummary || "no workouts logged recently"}

Give 2-3 concrete, actionable suggestions for the rest of today (what to eat, whether/how to train, sleep/recovery tip). Be specific to the numbers above, not generic.`;

  const data = await callChatCompletions({
    model,
    temperature: 0.5,
    messages: [{ role: "user", content: prompt }],
  });

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI response had no content");
  return content.trim();
}
