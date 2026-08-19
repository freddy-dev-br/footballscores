"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STEPS_KEY = "/api/steps?days=14";
const SLEEP_KEY = "/api/sleep?days=14";

interface StepsRow {
  date: string;
  count: number;
  source: string;
}
interface SleepRow {
  date: string;
  duration_minutes: number;
  source: string;
}

export default function ActivityPage() {
  const { data: steps } = useSWR<StepsRow[]>(STEPS_KEY, fetcher);
  const { data: sleep } = useSWR<SleepRow[]>(SLEEP_KEY, fetcher);

  const today = new Date().toISOString().slice(0, 10);
  const [stepsDate, setStepsDate] = useState(today);
  const [stepsCount, setStepsCount] = useState("");
  const [sleepDate, setSleepDate] = useState(today);
  const [sleepHours, setSleepHours] = useState("");

  async function saveSteps() {
    if (!stepsCount) return;
    await fetch("/api/steps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: stepsDate, count: Number(stepsCount), source: "manual" }),
    });
    setStepsCount("");
    mutate(STEPS_KEY);
  }

  async function saveSleep() {
    if (!sleepHours) return;
    await fetch("/api/sleep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: sleepDate, duration_minutes: Math.round(Number(sleepHours) * 60), source: "manual" }),
    });
    setSleepHours("");
    mutate(SLEEP_KEY);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity</h1>
        <p className="text-sm text-gray-500">Steps & sleep. Connect a wearable in Settings to sync automatically.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
          <h2 className="font-semibold text-gray-900">Log steps</h2>
          <input type="date" value={stepsDate} onChange={(e) => setStepsDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input
            type="number"
            value={stepsCount}
            onChange={(e) => setStepsCount(e.target.value)}
            placeholder="Step count"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button onClick={saveSteps} className="w-full bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-800">
            Save
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
          <h2 className="font-semibold text-gray-900">Log sleep</h2>
          <input type="date" value={sleepDate} onChange={(e) => setSleepDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input
            type="number"
            step="0.1"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            placeholder="Hours slept"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button onClick={saveSleep} className="w-full bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-800">
            Save
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Recent steps</h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y">
            {steps?.length === 0 && <p className="text-sm text-gray-400 p-3">No data yet.</p>}
            {steps?.map((s) => (
              <div key={s.date} className="flex justify-between px-3 py-2 text-sm">
                <span className="text-gray-600">{s.date}</span>
                <span className="font-medium">{s.count.toLocaleString()}</span>
                <span className="text-xs text-gray-400 capitalize">{s.source}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Recent sleep</h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y">
            {sleep?.length === 0 && <p className="text-sm text-gray-400 p-3">No data yet.</p>}
            {sleep?.map((s) => (
              <div key={s.date} className="flex justify-between px-3 py-2 text-sm">
                <span className="text-gray-600">{s.date}</span>
                <span className="font-medium">{(s.duration_minutes / 60).toFixed(1)}h</span>
                <span className="text-xs text-gray-400 capitalize">{s.source}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
