"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { Exercise } from "@/components/ExerciseCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SelectedExercise {
  exercise_id: number;
  name: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
}

export default function NewWorkoutPage() {
  const router = useRouter();
  const { data: exercises } = useSWR<Exercise[]>("/api/exercises", fetcher);

  const [name, setName] = useState("");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [selected, setSelected] = useState<SelectedExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  function addExercise(e: Exercise) {
    if (selected.some((s) => s.exercise_id === e.id)) return;
    setSelected([...selected, { exercise_id: e.id, name: e.name, sets: 3, reps: 10, weight_kg: null }]);
  }

  function removeExercise(id: number) {
    setSelected(selected.filter((s) => s.exercise_id !== id));
  }

  function updateExercise(id: number, patch: Partial<SelectedExercise>) {
    setSelected(selected.map((s) => (s.exercise_id === id ? { ...s, ...patch } : s)));
  }

  async function save() {
    if (!name.trim() || selected.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduled_date: scheduledDate,
          name,
          exercises: selected,
        }),
      });
      const workout = await res.json();
      router.push(`/workouts/${workout.id}`);
    } finally {
      setSaving(false);
    }
  }

  const filtered = exercises?.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New workout</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workout name, e.g. Push Day"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {selected.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">Selected exercises</h2>
          {selected.map((s) => (
            <div key={s.exercise_id} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
              <span className="flex-1 text-sm font-medium">{s.name}</span>
              <input
                type="number"
                value={s.sets}
                onChange={(e) => updateExercise(s.exercise_id, { sets: Number(e.target.value) })}
                className="w-14 border border-gray-300 rounded px-2 py-1 text-sm"
                aria-label="sets"
              />
              <span className="text-xs text-gray-400">sets</span>
              <input
                type="number"
                value={s.reps}
                onChange={(e) => updateExercise(s.exercise_id, { reps: Number(e.target.value) })}
                className="w-14 border border-gray-300 rounded px-2 py-1 text-sm"
                aria-label="reps"
              />
              <span className="text-xs text-gray-400">reps</span>
              <button onClick={() => removeExercise(s.exercise_id)} className="text-xs text-rose-600">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises to add…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
        />
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filtered?.map((e) => (
            <button
              key={e.id}
              onClick={() => addExercise(e)}
              disabled={selected.some((s) => s.exercise_id === e.id)}
              className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 text-sm hover:border-indigo-300 disabled:opacity-40"
            >
              <span className="font-medium">{e.name}</span>{" "}
              <span className="text-xs text-gray-400 capitalize">· {e.muscle_group}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving || !name.trim() || selected.length === 0}
        className="w-full bg-indigo-700 text-white py-3 rounded-lg font-medium hover:bg-indigo-800 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save workout"}
      </button>
    </div>
  );
}
