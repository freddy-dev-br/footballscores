"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import PhotoUpload from "@/components/PhotoUpload";
import MealCard, { Meal } from "@/components/MealCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface FoodAnalysis {
  items: { name: string; quantity_estimate: string }[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
  needs_more_info: boolean;
  clarifying_question: string | null;
  notes: string;
}

const MEALS_KEY = "/api/meals?limit=20";

export default function NutritionPage() {
  const { data: meals } = useSWR<Meal[]>(MEALS_KEY, fetcher);

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [mealType, setMealType] = useState("breakfast");
  const [extraContext, setExtraContext] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function analyze(context?: string) {
    if (!photoDataUrl) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/meals/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_data_url: photoDataUrl, extra_context: context }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnalyzeError(data.error ?? "Analysis failed.");
        setAnalysis(null);
      } else {
        setAnalysis(data);
      }
    } catch {
      setAnalyzeError("Network error — try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveMeal() {
    if (!analysis) return;
    setSaving(true);
    try {
      const description = analysis.items.map((i) => `${i.quantity_estimate} ${i.name}`).join(", ");
      await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meal_type: mealType,
          description,
          calories: analysis.calories,
          protein_g: analysis.protein_g,
          carbs_g: analysis.carbs_g,
          fat_g: analysis.fat_g,
          confidence: analysis.confidence,
          needs_more_info: false,
          ai_notes: analysis.notes,
          raw_analysis: analysis,
        }),
      });
      setPhotoDataUrl(null);
      setAnalysis(null);
      setExtraContext("");
      mutate(MEALS_KEY);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nutrition</h1>
        <p className="text-sm text-gray-500">Snap a photo and let AI estimate calories & macros.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <PhotoUpload
          onSelect={(dataUrl) => {
            setPhotoDataUrl(dataUrl);
            setAnalysis(null);
            setAnalyzeError(null);
            setExtraContext("");
          }}
        />

        {photoDataUrl && !analysis && (
          <button
            onClick={() => analyze()}
            disabled={analyzing}
            className="w-full bg-indigo-700 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-800 disabled:opacity-50"
          >
            {analyzing ? "Analyzing…" : "Analyze photo"}
          </button>
        )}

        {analyzeError && <p className="text-sm text-rose-600">{analyzeError}</p>}

        {analysis && (
          <div className="border-t pt-4 space-y-3">
            <ul className="text-sm text-gray-700 list-disc list-inside">
              {analysis.items.map((item, i) => (
                <li key={i}>
                  {item.quantity_estimate} {item.name}
                </li>
              ))}
            </ul>

            <div className="flex gap-4 text-sm">
              <span className="font-semibold text-indigo-700">{Math.round(analysis.calories)} kcal</span>
              <span className="text-gray-500">P {Math.round(analysis.protein_g)}g</span>
              <span className="text-gray-500">C {Math.round(analysis.carbs_g)}g</span>
              <span className="text-gray-500">F {Math.round(analysis.fat_g)}g</span>
              <span
                className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                  analysis.confidence >= 0.75
                    ? "bg-green-100 text-green-700"
                    : analysis.confidence >= 0.5
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                }`}
              >
                {Math.round(analysis.confidence * 100)}% confident
              </span>
            </div>

            {analysis.notes && <p className="text-xs text-gray-400 italic">{analysis.notes}</p>}

            {analysis.needs_more_info && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                <p className="text-sm text-amber-800 font-medium">
                  {analysis.clarifying_question ?? "Can you give a bit more detail about this meal?"}
                </p>
                <textarea
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  placeholder="e.g. about 2 cups, added 1 tbsp olive oil, no cheese"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  rows={2}
                />
                <button
                  onClick={() => analyze(extraContext)}
                  disabled={analyzing || !extraContext.trim()}
                  className="text-sm bg-amber-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50"
                >
                  {analyzing ? "Refining…" : "Refine estimate"}
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1.5"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
              <button
                onClick={saveMeal}
                disabled={saving}
                className="flex-1 bg-green-700 text-white py-2 rounded-lg font-medium hover:bg-green-800 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Log this meal"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent meals</h2>
        <div className="space-y-3">
          {meals?.length === 0 && <p className="text-sm text-gray-500">No meals logged yet.</p>}
          {meals?.map((m) => (
            <MealCard
              key={m.id}
              meal={m}
              onDelete={async (id) => {
                await fetch(`/api/meals/${id}`, { method: "DELETE" });
                mutate(MEALS_KEY);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
