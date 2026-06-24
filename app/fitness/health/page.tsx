"use client";

import { useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import WatchConnect from "@/components/fitness/WatchConnect";
import MetricCard from "@/components/fitness/MetricCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Profile {
  name: string;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  goal: string;
  daily_calorie_target: number;
  daily_step_target: number;
  sleep_target_hours: number;
}

interface StepsWeek {
  date: string;
  steps: number;
  distance_km: number;
  calories_burned: number;
}

const GOALS = ["weight_loss", "muscle_gain", "maintenance", "endurance", "flexibility"];

export default function HealthPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: profile, mutate: mutateProfile } = useSWR<Profile>("/api/fitness/profile", fetcher);
  const { data: weekSteps } = useSWR<StepsWeek[]>(`/api/fitness/steps?date=${today}&range=week`, fetcher);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});

  function startEdit() {
    if (profile) setForm({ ...profile });
    setEditing(true);
  }

  async function saveProfile() {
    setSaving(true);
    try {
      await fetch("/api/fitness/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      mutateProfile();
      globalMutate("/api/fitness/profile");
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function updateSteps(steps: number) {
    await fetch("/api/fitness/steps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: today, steps }),
    });
    globalMutate(`/api/fitness/steps?date=${today}`);
  }

  const totalWeekSteps = weekSteps?.reduce((s, d) => s + (d.steps || 0), 0) ?? 0;
  const totalWeekDist = weekSteps?.reduce((s, d) => s + (d.distance_km || 0), 0) ?? 0;
  const bmi = profile?.weight_kg && profile?.height_cm
    ? Math.round((profile.weight_kg / Math.pow(profile.height_cm / 100, 2)) * 10) / 10
    : null;

  return (
    <div className="pt-6 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Health</h1>
        <button
          onClick={editing ? saveProfile : startEdit}
          disabled={saving}
          className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-300 rounded-lg transition-colors"
        >
          {saving ? "Saving…" : editing ? "Save" : "Edit Profile"}
        </button>
      </div>

      {!editing ? (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xl">
              {profile?.name?.[0] || "U"}
            </div>
            <div>
              <p className="font-semibold text-white">{profile?.name || "User"}</p>
              <p className="text-xs text-gray-400 capitalize">{profile?.goal?.replace("_", " ") || "maintenance"}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Age", value: profile?.age ? `${profile.age}y` : "—" },
              { label: "Weight", value: profile?.weight_kg ? `${profile.weight_kg}kg` : "—" },
              { label: "Height", value: profile?.height_cm ? `${profile.height_cm}cm` : "—" },
            ].map((f) => (
              <div key={f.label} className="text-center bg-gray-700/40 rounded-xl py-2">
                <p className="text-xs text-gray-400">{f.label}</p>
                <p className="text-sm font-semibold text-white">{f.value}</p>
              </div>
            ))}
          </div>
          {bmi && (
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-400">BMI</p>
              <p className={`text-lg font-bold ${bmi < 18.5 ? "text-blue-400" : bmi < 25 ? "text-green-400" : bmi < 30 ? "text-yellow-400" : "text-red-400"}`}>
                {bmi}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-white text-sm">Edit Profile</h3>
          {(["name"] as const).map((field) => (
            <input
              key={field}
              type="text"
              placeholder="Name"
              value={(form[field] as string) || ""}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          ))}
          <div className="grid grid-cols-3 gap-2">
            {([
              { field: "age" as const, label: "Age", type: "number" },
              { field: "weight_kg" as const, label: "Weight (kg)", type: "number" },
              { field: "height_cm" as const, label: "Height (cm)", type: "number" },
            ]).map(({ field, label, type }) => (
              <div key={field}>
                <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                <input
                  type={type}
                  value={(form[field] as number) || ""}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Fitness Goal</label>
            <select
              value={form.goal || "maintenance"}
              onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              {GOALS.map((g) => (
                <option key={g} value={g} className="bg-gray-800 capitalize">
                  {g.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { field: "daily_calorie_target" as const, label: "Cal Target" },
              { field: "daily_step_target" as const, label: "Step Target" },
              { field: "sleep_target_hours" as const, label: "Sleep Target (h)" },
            ]).map(({ field, label }) => (
              <div key={field}>
                <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                <input
                  type="number"
                  value={(form[field] as number) || ""}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => setEditing(false)}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Weekly Steps"
          value={totalWeekSteps.toLocaleString()}
          color="cyan"
        />
        <MetricCard
          label="Weekly Distance"
          value={Math.round(totalWeekDist * 10) / 10}
          unit="km"
          color="green"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Log Steps Manually</h2>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4">
          <StepUpdater onUpdate={updateSteps} />
        </div>
      </div>

      <WatchConnect onData={(data) => {
        if (data.steps) updateSteps(data.steps);
      }} />
    </div>
  );
}

function StepUpdater({ onUpdate }: { onUpdate: (steps: number) => void }) {
  const [steps, setSteps] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!steps) return;
    setSaving(true);
    await onUpdate(parseInt(steps));
    setSteps("");
    setSaving(false);
  }

  return (
    <div className="flex gap-2">
      <input
        type="number"
        value={steps}
        onChange={(e) => setSteps(e.target.value)}
        placeholder="Enter step count"
        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
      />
      <button
        onClick={save}
        disabled={saving || !steps}
        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
      >
        {saving ? "…" : "Update"}
      </button>
    </div>
  );
}
