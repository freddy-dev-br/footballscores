"use client";

import { useState } from "react";
import useSWR from "swr";
import FoodLogger from "@/components/fitness/FoodLogger";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Meal {
  id: number;
  name: string;
  description: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  ai_analysis: string | null;
  meal_type: string;
  logged_at: string;
}

interface Profile {
  goal: string;
  daily_calorie_target: number;
}

const mealTypeIcon: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

export default function DietPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const { data: meals, mutate } = useSWR<Meal[]>(`/api/fitness/meals?date=${date}`, fetcher);
  const { data: profile } = useSWR<Profile>("/api/fitness/profile", fetcher);

  async function deleteMeal(id: number) {
    await fetch(`/api/fitness/meals?id=${id}`, { method: "DELETE" });
    mutate();
  }

  const totalCal = meals?.reduce((s, m) => s + (m.calories || 0), 0) ?? 0;
  const totalProtein = meals?.reduce((s, m) => s + (m.protein_g || 0), 0) ?? 0;
  const totalCarbs = meals?.reduce((s, m) => s + (m.carbs_g || 0), 0) ?? 0;
  const totalFat = meals?.reduce((s, m) => s + (m.fat_g || 0), 0) ?? 0;
  const calorieTarget = profile?.daily_calorie_target ?? 2000;
  const calProgress = Math.min((totalCal / calorieTarget) * 100, 100);

  return (
    <div className="pt-6 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Diet</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-green-500"
        />
      </div>

      <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Calories</p>
          <p className="text-xs text-gray-400">{totalCal} / {calorieTarget} kcal</p>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all ${totalCal > calorieTarget ? "bg-red-400" : "bg-green-400"}`}
            style={{ width: `${calProgress}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Protein", value: Math.round(totalProtein), unit: "g", color: "text-cyan-400" },
            { label: "Carbs", value: Math.round(totalCarbs), unit: "g", color: "text-yellow-400" },
            { label: "Fat", value: Math.round(totalFat), unit: "g", color: "text-orange-400" },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-xs text-gray-400">{m.label}</p>
              <p className={`text-lg font-bold ${m.color}`}>{m.value}<span className="text-xs font-normal text-gray-400">{m.unit}</span></p>
            </div>
          ))}
        </div>
      </div>

      <FoodLogger goal={profile?.goal} onLogged={() => mutate()} />

      <div className="space-y-2">
        {!meals && <p className="text-gray-500 text-sm text-center py-4">Loading…</p>}
        {meals?.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">No meals logged yet. Take a photo of your food!</p>
        )}
        {meals?.map((m) => (
          <div key={m.id} className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{mealTypeIcon[m.meal_type] || "🍽️"}</span>
                <div>
                  <p className="font-medium text-white">{m.name}</p>
                  {m.description && <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>}
                  <div className="flex gap-3 text-xs text-gray-400 mt-1">
                    {m.calories && <span className="text-orange-400 font-medium">{m.calories} kcal</span>}
                    {m.protein_g && <span>P: {m.protein_g}g</span>}
                    {m.carbs_g && <span>C: {m.carbs_g}g</span>}
                    {m.fat_g && <span>F: {m.fat_g}g</span>}
                  </div>
                  {m.ai_analysis && (
                    <p className="text-xs text-indigo-300 mt-1 italic">💡 {m.ai_analysis}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteMeal(m.id)}
                className="text-gray-600 hover:text-red-400 text-lg leading-none transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
