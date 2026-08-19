"use client";

import { useState } from "react";

export default function AICoach() {
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState(false);

  async function fetchAdvice(context?: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/fitness/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
      });
      const data = await res.json();
      setAdvice(data.advice);
    } catch {
      setAdvice("Unable to load advice right now. Keep up the great work!");
    } finally {
      setLoading(false);
    }
  }

  function handleAsk() {
    if (!question.trim()) return;
    setAsked(true);
    fetchAdvice(question);
    setQuestion("");
  }

  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">✨</span>
        <h3 className="font-semibold text-indigo-300">AI Coach</h3>
      </div>

      {!advice && !loading && !asked && (
        <button
          onClick={() => fetchAdvice()}
          className="text-sm text-indigo-400 hover:text-indigo-300 underline"
        >
          Get personalized advice for today
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <span className="animate-spin">⟳</span>
          <span>Analyzing your data…</span>
        </div>
      )}

      {advice && !loading && (
        <p className="text-sm text-gray-200 leading-relaxed">{advice}</p>
      )}

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="Ask your coach something…"
          className="flex-1 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Ask
        </button>
      </div>
    </div>
  );
}
