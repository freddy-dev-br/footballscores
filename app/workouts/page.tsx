"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import ExerciseCard, { Exercise } from "@/components/ExerciseCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Workout {
  id: number;
  scheduled_date: string;
  name: string;
  completed: number;
  exercises: { name: string }[];
}

const CATEGORIES = ["all", "strength", "cardio", "core", "mobility"];

export default function WorkoutsPage() {
  const [category, setCategory] = useState("all");
  const { data: exercises } = useSWR<Exercise[]>(
    category === "all" ? "/api/exercises" : `/api/exercises?category=${category}`,
    fetcher
  );
  const { data: workouts } = useSWR<Workout[]>("/api/workouts?upcoming=1", fetcher);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
          <p className="text-sm text-gray-500">Build a plan and learn proper form.</p>
        </div>
        <Link
          href="/workouts/new"
          className="bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-indigo-800"
        >
          + New workout
        </Link>
      </div>

      {workouts && workouts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Upcoming</h2>
          <div className="space-y-2">
            {workouts.map((w) => (
              <Link
                key={w.id}
                href={`/workouts/${w.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-3 hover:border-indigo-300"
              >
                <p className="font-medium text-gray-900">{w.name}</p>
                <p className="text-xs text-gray-500">
                  {w.scheduled_date} · {w.exercises.length} exercises
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Exercise library</h2>
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-sm px-3 py-1.5 rounded-full capitalize whitespace-nowrap ${
                category === c ? "bg-indigo-700 text-white" : "bg-white border border-gray-300 text-gray-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {exercises?.map((e) => (
            <ExerciseCard key={e.id} exercise={e} />
          ))}
        </div>
      </div>
    </div>
  );
}
