"use client";

import { useState } from "react";

const WORKOUT_TYPES = ["cardio", "strength", "flexibility", "sports", "other"];

interface WorkoutLoggerProps {
  onLogged?: () => void;
}

export default function WorkoutLogger({ onLogged }: WorkoutLoggerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "cardio",
    name: "",
    duration_minutes: "",
    calories_burned: "",
    distance_km: "",
    notes: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit() {
    if (!form.name || !form.duration_minutes) return;
    setLoading(true);
    try {
      await fetch("/api/fitness/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          name: form.name,
          duration_minutes: parseInt(form.duration_minutes),
          calories_burned: form.calories_burned ? parseInt(form.calories_burned) : null,
          distance_km: form.distance_km ? parseFloat(form.distance_km) : null,
          notes: form.notes || null,
        }),
      });
      setForm({ type: "cardio", name: "", duration_minutes: "", calories_burned: "", distance_km: "", notes: "" });
      setOpen(false);
      onLogged?.();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
      >
        <span>⚡</span> Log Workout
      </button>
    );
  }

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 space-y-3">
      <h3 className="font-semibold text-white">New Workout</h3>

      <div className="flex gap-2 flex-wrap">
        {WORKOUT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => set("type", t)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
              form.type === t
                ? "bg-cyan-500 text-white"
                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Workout name (e.g. Morning Run)"
        value={form.name}
        onChange={(e) => set("name", e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
      />

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Duration (min)</label>
          <input
            type="number"
            placeholder="30"
            value={form.duration_minutes}
            onChange={(e) => set("duration_minutes", e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Calories</label>
          <input
            type="number"
            placeholder="0"
            value={form.calories_burned}
            onChange={(e) => set("calories_burned", e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Distance (km)</label>
          <input
            type="number"
            step="0.1"
            placeholder="0"
            value={form.distance_km}
            onChange={(e) => set("distance_km", e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <input
        type="text"
        placeholder="Notes (optional)"
        value={form.notes}
        onChange={(e) => set("notes", e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
      />

      <div className="flex gap-2">
        <button
          onClick={() => setOpen(false)}
          className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={loading || !form.name || !form.duration_minutes}
          className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? "Saving…" : "Save Workout"}
        </button>
      </div>
    </div>
  );
}
