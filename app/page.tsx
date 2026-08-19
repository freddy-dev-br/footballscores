"use client";

import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import StatCard from "@/components/StatCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Goal {
  goal_type: string;
  target_calories: number | null;
  target_steps: number | null;
  target_sleep_hours: number | null;
}
interface StepsRow {
  date: string;
  count: number;
}
interface SleepRow {
  date: string;
  duration_minutes: number;
}
interface Meal {
  calories: number | null;
}
interface Workout {
  id: number;
  scheduled_date: string;
  name: string;
  completed: number;
}

export default function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: goal } = useSWR<Goal>("/api/goals", fetcher);
  const { data: stepsRows } = useSWR<StepsRow[]>("/api/steps?days=1", fetcher);
  const { data: sleepRows } = useSWR<SleepRow[]>("/api/sleep?days=1", fetcher);
  const { data: meals } = useSWR<Meal[]>(`/api/meals?date=${today}`, fetcher);
  const { data: workouts } = useSWR<Workout[]>("/api/workouts?upcoming=1", fetcher);

  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const todaySteps = stepsRows?.find((s) => s.date === today)?.count ?? null;
  const lastNightSleep = sleepRows?.[0];
  const caloriesConsumed = meals?.reduce((sum, m) => sum + (m.calories ?? 0), 0) ?? 0;
  const nextWorkout = workouts?.[0];

  async function fetchAdvice() {
    setLoadingAdvice(true);
    setAdviceError(null);
    setAdvice(null);
    try {
      const res = await fetch("/api/coach/advice", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setAdviceError(data.error ?? "Could not get advice.");
      } else {
        setAdvice(data.advice);
      }
    } catch {
      setAdviceError("Network error — try again.");
    } finally {
      setLoadingAdvice(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Today</h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Calories"
          value={caloriesConsumed}
          unit={`/ ${goal?.target_calories ?? "?"} kcal`}
          accent="indigo"
        />
        <StatCard label="Steps" value={todaySteps ?? "—"} unit={`/ ${goal?.target_steps ?? "?"}`} accent="green" />
        <StatCard
          label="Sleep last night"
          value={lastNightSleep ? (lastNightSleep.duration_minutes / 60).toFixed(1) : "—"}
          unit="h"
          sublabel={goal?.target_sleep_hours ? `target ${goal.target_sleep_hours}h` : undefined}
          accent="amber"
        />
        <StatCard
          label="Next workout"
          value={nextWorkout ? nextWorkout.name : "None scheduled"}
          sublabel={nextWorkout ? nextWorkout.scheduled_date : undefined}
          accent="rose"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">AI coach</h2>
          <button
            onClick={fetchAdvice}
            disabled={loadingAdvice}
            className="text-sm bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-800 disabled:opacity-50"
          >
            {loadingAdvice ? "Thinking…" : "Get today's advice"}
          </button>
        </div>
        {advice && <p className="text-sm text-gray-700 mt-3 whitespace-pre-line">{advice}</p>}
        {adviceError && (
          <p className="text-sm text-rose-600 mt-3">
            {adviceError}
            {adviceError.includes("OPENAI_API_KEY") && (
              <>
                {" "}
                See <Link href="/settings" className="underline">Settings</Link> for setup.
              </>
            )}
          </p>
        )}
        {!advice && !adviceError && (
          <p className="text-sm text-gray-400 mt-3">Get a quick, personalized nutrition and training tip based on your recent logs.</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/nutrition"
          className="flex-1 bg-indigo-700 text-white text-center py-3 rounded-lg font-medium hover:bg-indigo-800"
        >
          Log a meal
        </Link>
        <Link
          href="/workouts"
          className="flex-1 bg-white border border-gray-300 text-gray-800 text-center py-3 rounded-lg font-medium hover:bg-gray-50"
        >
          Browse workouts
        </Link>
      </div>
    </div>
  );
}
