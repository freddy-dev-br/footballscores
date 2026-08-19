"use client";

import useSWR from "swr";
import Link from "next/link";
import MetricCard from "@/components/fitness/MetricCard";
import AICoach from "@/components/fitness/AICoach";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Profile {
  name: string;
  goal: string;
  daily_calorie_target: number;
  daily_step_target: number;
  sleep_target_hours: number;
}

interface Steps {
  steps: number;
  distance_km: number;
  calories_burned: number;
}

interface Meal {
  calories: number;
  protein_g: number;
}

interface Sleep {
  duration_minutes: number;
  quality: string;
}

interface Workout {
  id: number;
  name: string;
  type: string;
  duration_minutes: number;
  calories_burned: number;
}

export default function FitnessToday() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: profile } = useSWR<Profile>("/api/fitness/profile", fetcher);
  const { data: steps } = useSWR<Steps>(`/api/fitness/steps?date=${today}`, fetcher, { refreshInterval: 30000 });
  const { data: meals } = useSWR<Meal[]>(`/api/fitness/meals?date=${today}`, fetcher);
  const { data: sleep } = useSWR<Sleep[]>(`/api/fitness/sleep?date=${today}`, fetcher);
  const { data: workouts } = useSWR<Workout[]>(`/api/fitness/workouts?date=${today}`, fetcher);

  const totalCalories = meals?.reduce((s, m) => s + (m.calories || 0), 0) ?? 0;
  const totalProtein = meals?.reduce((s, m) => s + (m.protein_g || 0), 0) ?? 0;
  const lastSleep = sleep?.[0];
  const sleepHours = lastSleep ? Math.round((lastSleep.duration_minutes / 60) * 10) / 10 : 0;
  const stepCount = steps?.steps ?? 0;
  const stepTarget = profile?.daily_step_target ?? 10000;
  const calorieTarget = profile?.daily_calorie_target ?? 2000;
  const sleepTarget = profile?.sleep_target_hours ?? 8;

  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <div className="pt-6 pb-4 space-y-5">
      <div>
        <p className="text-gray-400 text-sm">{dayName}, {dateStr}</p>
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {profile?.name ?? "there"} 👋
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Steps"
          value={stepCount.toLocaleString()}
          subtitle={`${stepTarget.toLocaleString()} target`}
          color="cyan"
          progress={(stepCount / stepTarget) * 100}
        />
        <MetricCard
          label="Calories"
          value={totalCalories}
          unit="kcal"
          subtitle={`${calorieTarget} target`}
          color="orange"
          progress={(totalCalories / calorieTarget) * 100}
        />
        <MetricCard
          label="Sleep"
          value={sleepHours || "—"}
          unit={sleepHours ? "hrs" : ""}
          subtitle={lastSleep?.quality ? `${lastSleep.quality} quality` : "Not logged"}
          color="purple"
          progress={sleepHours ? (sleepHours / sleepTarget) * 100 : 0}
        />
        <MetricCard
          label="Protein"
          value={Math.round(totalProtein)}
          unit="g"
          subtitle={`${meals?.length ?? 0} meals today`}
          color="green"
        />
      </div>

      <AICoach />

      {workouts && workouts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Today&apos;s Activity</h2>
          <div className="space-y-2">
            {workouts.map((w) => (
              <div key={w.id} className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {w.type === "cardio" ? "🏃" : w.type === "strength" ? "💪" : w.type === "flexibility" ? "🧘" : "⚡"}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{w.name}</p>
                    <p className="text-xs text-gray-500">{w.duration_minutes} min{w.calories_burned ? ` · ${w.calories_burned} kcal` : ""}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/fitness/workouts" className="bg-gray-800/60 border border-gray-700/50 hover:border-cyan-500/50 rounded-xl p-4 text-center transition-colors group">
          <span className="text-2xl block mb-1">⚡</span>
          <p className="text-sm font-medium text-gray-300 group-hover:text-cyan-400">Log Workout</p>
        </Link>
        <Link href="/fitness/diet" className="bg-gray-800/60 border border-gray-700/50 hover:border-green-500/50 rounded-xl p-4 text-center transition-colors group">
          <span className="text-2xl block mb-1">📷</span>
          <p className="text-sm font-medium text-gray-300 group-hover:text-green-400">Log Meal</p>
        </Link>
        <Link href="/fitness/sleep" className="bg-gray-800/60 border border-gray-700/50 hover:border-purple-500/50 rounded-xl p-4 text-center transition-colors group">
          <span className="text-2xl block mb-1">🌙</span>
          <p className="text-sm font-medium text-gray-300 group-hover:text-purple-400">Log Sleep</p>
        </Link>
        <Link href="/fitness/health" className="bg-gray-800/60 border border-gray-700/50 hover:border-red-500/50 rounded-xl p-4 text-center transition-colors group">
          <span className="text-2xl block mb-1">❤</span>
          <p className="text-sm font-medium text-gray-300 group-hover:text-red-400">Health Stats</p>
        </Link>
      </div>
    </div>
  );
}
