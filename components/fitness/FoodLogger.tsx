"use client";

import { useRef, useState } from "react";

interface FoodAnalysis {
  name: string;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal_type: string;
  advice: string;
}

interface FoodLoggerProps {
  goal?: string;
  onLogged?: () => void;
}

export default function FoodLogger({ goal, onLogged }: FoodLoggerProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState("image/jpeg");
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manual, setManual] = useState({ name: "", calories: "", protein_g: "", carbs_g: "", fat_g: "", meal_type: "snack" });
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const base64 = result.split(",")[1];
      setImageBase64(base64);
      setPreview(result);
      setAnalysis(null);
    };
    reader.readAsDataURL(file);
  }

  async function analyze() {
    if (!imageBase64) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/fitness/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: imageBase64, media_type: mediaType, goal }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
    } catch (err) {
      alert("Could not analyze image: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveMeal(data: FoodAnalysis) {
    setSaving(true);
    try {
      await fetch("/api/fitness/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          calories: data.calories,
          protein_g: data.protein_g,
          carbs_g: data.carbs_g,
          fat_g: data.fat_g,
          ai_analysis: data.advice,
          photo_data: imageBase64 ? `data:${mediaType};base64,${imageBase64}` : null,
          meal_type: data.meal_type,
        }),
      });
      reset();
      onLogged?.();
    } finally {
      setSaving(false);
    }
  }

  async function saveManual() {
    if (!manual.name) return;
    setSaving(true);
    try {
      await fetch("/api/fitness/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manual.name,
          calories: manual.calories ? parseInt(manual.calories) : null,
          protein_g: manual.protein_g ? parseFloat(manual.protein_g) : null,
          carbs_g: manual.carbs_g ? parseFloat(manual.carbs_g) : null,
          fat_g: manual.fat_g ? parseFloat(manual.fat_g) : null,
          meal_type: manual.meal_type,
        }),
      });
      reset();
      onLogged?.();
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setOpen(false);
    setPreview(null);
    setImageBase64(null);
    setAnalysis(null);
    setManualMode(false);
    setManual({ name: "", calories: "", protein_g: "", carbs_g: "", fat_g: "", meal_type: "snack" });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
      >
        <span>📷</span> Log Meal
      </button>
    );
  }

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Log Meal</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setManualMode(false)}
            className={`text-xs px-2 py-1 rounded-full ${!manualMode ? "bg-green-500 text-white" : "bg-gray-700 text-gray-400"}`}
          >
            📷 Photo
          </button>
          <button
            onClick={() => setManualMode(true)}
            className={`text-xs px-2 py-1 rounded-full ${manualMode ? "bg-green-500 text-white" : "bg-gray-700 text-gray-400"}`}
          >
            ✏️ Manual
          </button>
        </div>
      </div>

      {!manualMode && (
        <>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
          {!preview ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-green-500 hover:text-green-400 transition-colors"
            >
              <span className="text-3xl mb-1">📷</span>
              <span className="text-sm">Take photo or upload image</span>
            </button>
          ) : (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Food" className="w-full h-40 object-cover rounded-xl" />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg"
              >
                Change
              </button>
            </div>
          )}

          {preview && !analysis && (
            <button
              onClick={analyze}
              disabled={analyzing}
              className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <><span className="animate-spin">⟳</span> Analyzing with AI…</>
              ) : (
                <><span>✨</span> Analyze with AI</>
              )}
            </button>
          )}

          {analysis && (
            <div className="space-y-3">
              <div className="bg-gray-700/50 rounded-xl p-3">
                <p className="font-medium text-white">{analysis.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{analysis.description}</p>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[
                    { label: "Cal", value: analysis.calories },
                    { label: "Protein", value: `${analysis.protein_g}g` },
                    { label: "Carbs", value: `${analysis.carbs_g}g` },
                    { label: "Fat", value: `${analysis.fat_g}g` },
                  ].map((m) => (
                    <div key={m.label} className="text-center">
                      <p className="text-xs text-gray-400">{m.label}</p>
                      <p className="text-sm font-semibold text-green-400">{m.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-indigo-300 mt-2 italic">💡 {analysis.advice}</p>
              </div>
              <button
                onClick={() => saveMeal(analysis)}
                disabled={saving}
                className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? "Saving…" : "Save Meal"}
              </button>
            </div>
          )}
        </>
      )}

      {manualMode && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Meal name"
            value={manual.name}
            onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
          />
          <div className="grid grid-cols-2 gap-2">
            {(["calories", "protein_g", "carbs_g", "fat_g"] as const).map((field) => (
              <input
                key={field}
                type="number"
                placeholder={field.replace("_g", "").replace("_", " ") + (field.endsWith("_g") ? " (g)" : " (kcal)")}
                value={manual[field]}
                onChange={(e) => setManual((m) => ({ ...m, [field]: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              />
            ))}
          </div>
          <select
            value={manual.meal_type}
            onChange={(e) => setManual((m) => ({ ...m, meal_type: e.target.value }))}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
          >
            {["breakfast", "lunch", "dinner", "snack"].map((t) => (
              <option key={t} value={t} className="bg-gray-800 capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <button
            onClick={saveManual}
            disabled={saving || !manual.name}
            className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? "Saving…" : "Save Meal"}
          </button>
        </div>
      )}

      <button onClick={reset} className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        Cancel
      </button>
    </div>
  );
}
