"use client";

import { useState } from "react";
import useSWR from "swr";
import WorkoutLogger from "@/components/fitness/WorkoutLogger";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Workout {
  id: number;
  type: string;
  name: string;
  duration_minutes: number;
  calories_burned: number | null;
  distance_km: number | null;
  notes: string | null;
  logged_at: string;
}

const typeIcon: Record<string, string> = {
  cardio: "🏃",
  strength: "💪",
  flexibility: "🧘",
  sports: "⚽",
  other: "⚡",
};

export default function WorkoutsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const { data: workouts, mutate } = useSWR<Workout[]>(`/api/fitness/workouts?date=${date}`, fetcher);

  async function deleteWorkout(id: number) {
    await fetch(`/api/fitness/workouts?id=${id}`, { method: "DELETE" });
    mutate();
  }

  const totalMin = workouts?.reduce((s, w) => s + (w.duration_minutes || 0), 0) ?? 0;
  const totalCal = workouts?.reduce((s, w) => s + (w.calories_burned || 0), 0) ?? 0;

  return (
    <div className="pt-6 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Fitness</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-cyan-500"
        />
      </div>

      {workouts && workouts.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">Total Time</p>
            <p className="text-xl font-bold text-cyan-400">{Math.floor(totalMin / 60)}h {totalMin % 60}m</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">Calories Burned</p>
            <p className="text-xl font-bold text-orange-400">{totalCal} kcal</p>
          </div>
        </div>
      )}

      <WorkoutLogger onLogged={() => mutate()} />

      <div className="space-y-2">
        {!workouts && <p className="text-gray-500 text-sm text-center py-4">Loading…</p>}
        {workouts?.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">No workouts logged for this day. Add one above!</p>
        )}
        {workouts?.map((w) => (
          <div key={w.id} className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{typeIcon[w.type] || "⚡"}</span>
                <div>
                  <p className="font-medium text-white">{w.name}</p>
                  <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                    <span>{w.duration_minutes} min</span>
                    {w.calories_burned && <span>{w.calories_burned} kcal</span>}
                    {w.distance_km && <span>{w.distance_km} km</span>}
                  </div>
                  {w.notes && <p className="text-xs text-gray-500 mt-1 italic">{w.notes}</p>}
                </div>
              </div>
              <button
                onClick={() => deleteWorkout(w.id)}
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
