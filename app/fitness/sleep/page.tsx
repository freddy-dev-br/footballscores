"use client";

import useSWR from "swr";
import SleepLogger from "@/components/fitness/SleepLogger";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SleepSession {
  id: number;
  date: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  quality: string;
  deep_sleep_minutes: number;
  rem_sleep_minutes: number;
  light_sleep_minutes: number;
  notes: string | null;
}

interface Profile {
  sleep_target_hours: number;
}

const qualityColor: Record<string, string> = {
  excellent: "text-green-400",
  good: "text-cyan-400",
  fair: "text-yellow-400",
  poor: "text-red-400",
};

export default function SleepPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: sessions, mutate } = useSWR<SleepSession[]>(`/api/fitness/sleep?date=${today}&range=week`, fetcher);
  const { data: profile } = useSWR<Profile>("/api/fitness/profile", fetcher);

  async function deleteSession(id: number) {
    await fetch(`/api/fitness/sleep?id=${id}`, { method: "DELETE" });
    mutate();
  }

  const sleepTarget = profile?.sleep_target_hours ?? 8;
  const avgMinutes = sessions && sessions.length > 0
    ? sessions.reduce((s, sess) => s + (sess.duration_minutes || 0), 0) / sessions.length
    : 0;
  const avgHours = Math.round((avgMinutes / 60) * 10) / 10;

  return (
    <div className="pt-6 pb-4 space-y-5">
      <h1 className="text-xl font-bold text-white">Sleep</h1>

      {sessions && sessions.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">7-Day Average</p>
            <p className="text-xl font-bold text-purple-400">{avgHours}h</p>
            <p className="text-xs text-gray-500">target: {sleepTarget}h</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-2">This Week</p>
            <div className="flex items-end gap-1 h-8">
              {sessions.slice(-7).map((s, i) => {
                const h = (s.duration_minutes || 0) / 60;
                const pct = Math.min((h / 10) * 100, 100);
                return (
                  <div
                    key={i}
                    title={`${s.date}: ${Math.round(h * 10) / 10}h`}
                    className="flex-1 bg-purple-500 rounded-sm opacity-80"
                    style={{ height: `${pct}%` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      <SleepLogger onLogged={() => mutate()} />

      <div className="space-y-2">
        {!sessions && <p className="text-gray-500 text-sm text-center py-4">Loading…</p>}
        {sessions?.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">No sleep sessions logged this week. Start tracking tonight!</p>
        )}
        {sessions?.slice().reverse().map((s) => {
          const hours = s.duration_minutes ? Math.floor(s.duration_minutes / 60) : 0;
          const mins = s.duration_minutes ? s.duration_minutes % 60 : 0;
          return (
            <div key={s.id} className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{s.date}</p>
                    <span className={`text-xs font-medium capitalize ${qualityColor[s.quality] || "text-gray-400"}`}>{s.quality}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s.start_time} → {s.end_time || "—"} · {hours}h {mins}m
                  </p>
                  {(s.deep_sleep_minutes > 0 || s.rem_sleep_minutes > 0) && (
                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                      {s.deep_sleep_minutes > 0 && <span>Deep: {s.deep_sleep_minutes}m</span>}
                      {s.rem_sleep_minutes > 0 && <span>REM: {s.rem_sleep_minutes}m</span>}
                      {s.light_sleep_minutes > 0 && <span>Light: {s.light_sleep_minutes}m</span>}
                    </div>
                  )}
                  {s.notes && <p className="text-xs text-gray-500 mt-1 italic">{s.notes}</p>}
                </div>
                <button
                  onClick={() => deleteSession(s.id)}
                  className="text-gray-600 hover:text-red-400 text-lg leading-none transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
