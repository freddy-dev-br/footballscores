"use client";

import { use, useState } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface WorkoutExercise {
  id: number;
  exercise_id: number;
  name: string;
  muscle_group: string;
  instructions: string;
  video_search_query: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
  completed: number;
}
interface Workout {
  id: number;
  name: string;
  scheduled_date: string;
  completed: number;
  exercises: WorkoutExercise[];
}

export default function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const key = `/api/workouts/${id}`;
  const { data: workout } = useSWR<Workout>(key, fetcher);
  const [completing, setCompleting] = useState(false);

  async function toggleExercise(exId: number, currentlyDone: number) {
    if (!workout) return;
    await fetch(key, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exercise_updates: [{ id: exId, completed: currentlyDone ? 0 : 1 }],
      }),
    });
    mutate(key);
  }

  async function completeWorkout() {
    setCompleting(true);
    try {
      await fetch(key, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
      mutate(key);
    } finally {
      setCompleting(false);
    }
  }

  if (!workout) return <p className="text-gray-400 text-sm">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{workout.name}</h1>
        <p className="text-sm text-gray-500">{workout.scheduled_date}</p>
      </div>

      <div className="space-y-3">
        {workout.exercises.map((ex) => {
          const videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.video_search_query)}`;
          return (
            <div key={ex.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={!!ex.completed}
                  onChange={() => toggleExercise(ex.id, ex.completed)}
                  className="mt-1 w-5 h-5"
                />
                <div className="flex-1">
                  <p className={`font-medium ${ex.completed ? "line-through text-gray-400" : "text-gray-900"}`}>
                    {ex.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {ex.sets} sets × {ex.reps} reps{ex.weight_kg ? ` @ ${ex.weight_kg}kg` : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{ex.instructions}</p>
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm text-indigo-600 hover:underline mt-1"
                  >
                    ▶ Watch proper form
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!workout.completed && (
        <button
          onClick={completeWorkout}
          disabled={completing}
          className="w-full bg-green-700 text-white py-3 rounded-lg font-medium hover:bg-green-800 disabled:opacity-50"
        >
          {completing ? "Saving…" : "Mark workout complete"}
        </button>
      )}
      {!!workout.completed && (
        <p className="text-center text-sm text-green-700 font-medium">✓ Workout completed</p>
      )}
    </div>
  );
}
