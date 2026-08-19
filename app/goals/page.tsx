"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const GOAL_KEY = "/api/goals";

interface Goal {
  goal_type: string;
  target_calories: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
  target_steps: number | null;
  target_sleep_hours: number | null;
  target_workouts_per_week: number | null;
  notes: string | null;
}

const GOAL_TYPES = [
  { value: "weight_loss", label: "Weight loss" },
  { value: "muscle_gain", label: "Muscle gain" },
  { value: "maintenance", label: "Maintenance" },
  { value: "endurance", label: "Endurance" },
];

export default function GoalsPage() {
  const { data: goal } = useSWR<Goal>(GOAL_KEY, fetcher);
  const [form, setForm] = useState<Goal | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (goal) setForm(goal);
  }, [goal]);

  if (!form) return <p className="text-gray-400 text-sm">Loading…</p>;

  function field<K extends keyof Goal>(key: K, label: string, type = "number") {
    return (
      <label className="block">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <input
          type={type}
          value={form![key] ?? ""}
          onChange={(e) =>
            setForm({ ...form!, [key]: type === "number" ? Number(e.target.value) : e.target.value })
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
        />
      </label>
    );
  }

  async function save() {
    setSaved(false);
    await fetch(GOAL_KEY, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    mutate(GOAL_KEY);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
        <p className="text-sm text-gray-500">Drives your dashboard targets and AI coaching advice.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-gray-500">Goal type</span>
          <select
            value={form.goal_type}
            onChange={(e) => setForm({ ...form, goal_type: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
          >
            {GOAL_TYPES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          {field("target_calories", "Daily calories (kcal)")}
          {field("target_protein_g", "Protein (g)")}
          {field("target_carbs_g", "Carbs (g)")}
          {field("target_fat_g", "Fat (g)")}
          {field("target_steps", "Daily steps")}
          {field("target_sleep_hours", "Sleep target (h)")}
          {field("target_workouts_per_week", "Workouts / week")}
        </div>

        <label className="block">
          <span className="text-xs font-medium text-gray-500">Notes (injuries, preferences, allergies…)</span>
          <textarea
            value={form.notes ?? ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
            rows={3}
          />
        </label>

        <button
          onClick={save}
          className="w-full bg-indigo-700 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-800"
        >
          {saved ? "Saved ✓" : "Save goals"}
        </button>
      </div>
    </div>
  );
}
