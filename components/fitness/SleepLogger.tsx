"use client";

import { useState } from "react";

const QUALITY_OPTIONS = ["excellent", "good", "fair", "poor"];

interface SleepLoggerProps {
  onLogged?: () => void;
}

export default function SleepLogger({ onLogged }: SleepLoggerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    start_time: "23:00",
    end_time: "07:00",
    quality: "good",
    deep_sleep_minutes: "",
    rem_sleep_minutes: "",
    notes: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function calcDuration(): number {
    try {
      const [sh, sm] = form.start_time.split(":").map(Number);
      const [eh, em] = form.end_time.split(":").map(Number);
      let startMin = sh * 60 + sm;
      let endMin = eh * 60 + em;
      if (endMin <= startMin) endMin += 24 * 60;
      return endMin - startMin;
    } catch {
      return 0;
    }
  }

  async function submit() {
    const duration = calcDuration();
    setLoading(true);
    try {
      await fetch("/api/fitness/sleep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          start_time: form.start_time,
          end_time: form.end_time,
          duration_minutes: duration,
          quality: form.quality,
          deep_sleep_minutes: form.deep_sleep_minutes ? parseInt(form.deep_sleep_minutes) : 0,
          rem_sleep_minutes: form.rem_sleep_minutes ? parseInt(form.rem_sleep_minutes) : 0,
          light_sleep_minutes: Math.max(0, duration - (parseInt(form.deep_sleep_minutes || "0") + parseInt(form.rem_sleep_minutes || "0"))),
          notes: form.notes || null,
        }),
      });
      setOpen(false);
      onLogged?.();
    } finally {
      setLoading(false);
    }
  }

  const duration = calcDuration();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
      >
        <span>🌙</span> Log Sleep
      </button>
    );
  }

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 space-y-3">
      <h3 className="font-semibold text-white">Log Sleep</h3>

      <div>
        <label className="text-xs text-gray-400 mb-1 block">Date</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => set("date", e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Bedtime</label>
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => set("start_time", e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Wake time</label>
          <input
            type="time"
            value={form.end_time}
            onChange={(e) => set("end_time", e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {duration > 0 && (
        <div className="bg-purple-900/30 border border-purple-700/40 rounded-lg px-3 py-2 text-center">
          <p className="text-xs text-gray-400">Total sleep</p>
          <p className="text-lg font-bold text-purple-300">
            {Math.floor(duration / 60)}h {duration % 60}m
          </p>
        </div>
      )}

      <div>
        <label className="text-xs text-gray-400 mb-1 block">Sleep quality</label>
        <div className="flex gap-2">
          {QUALITY_OPTIONS.map((q) => (
            <button
              key={q}
              onClick={() => set("quality", q)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                form.quality === q ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Deep sleep (min)</label>
          <input
            type="number"
            placeholder="90"
            value={form.deep_sleep_minutes}
            onChange={(e) => set("deep_sleep_minutes", e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">REM sleep (min)</label>
          <input
            type="number"
            placeholder="120"
            value={form.rem_sleep_minutes}
            onChange={(e) => set("rem_sleep_minutes", e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <input
        type="text"
        placeholder="Notes (optional)"
        value={form.notes}
        onChange={(e) => set("notes", e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
      />

      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={loading}
          className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? "Saving…" : "Save Sleep"}
        </button>
      </div>
    </div>
  );
}
