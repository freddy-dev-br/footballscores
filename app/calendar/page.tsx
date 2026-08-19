"use client";

import { useState } from "react";
import useSWR from "swr";
import type { Match } from "@/components/MatchCard";
import MatchCard from "@/components/MatchCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toMonthStr(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    today.toISOString().slice(0, 10)
  );

  const monthStr = toMonthStr(year, month);
  const { data: matchesByDate, isLoading } = useSWR<Record<string, Match[]>>(
    `/api/matches/calendar?month=${monthStr}`,
    fetcher
  );

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today.toISOString().slice(0, 10);

  const cells: Array<number | null> = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedMatches = selectedDate ? matchesByDate?.[selectedDate] ?? [] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fixtures Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="font-semibold text-gray-800 min-w-[140px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">
              {d}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) {
                return <div key={i} className="h-14 border-b border-r border-gray-50 last:border-r-0" />;
              }
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayMatches = matchesByDate?.[dateStr] ?? [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const hasMatches = dayMatches.length > 0;
              const liveCount = dayMatches.filter(
                (m) => m.status === "IN_PLAY" || m.status === "LIVE" || m.status === "PAUSED"
              ).length;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-14 border-b border-r border-gray-100 last:border-r-0 flex flex-col items-center justify-start pt-1.5 gap-0.5 transition-colors relative
                    ${isSelected ? "bg-green-50 border-green-200" : "hover:bg-gray-50"}
                  `}
                >
                  <span
                    className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                      ${isToday ? "bg-green-700 text-white" : isSelected ? "text-green-700" : "text-gray-700"}
                    `}
                  >
                    {day}
                  </span>
                  {hasMatches && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0 rounded-full leading-4
                        ${liveCount > 0 ? "bg-red-500 text-white animate-pulse" : "bg-green-100 text-green-700"}
                      `}
                    >
                      {liveCount > 0 ? `${liveCount} LIVE` : `${dayMatches.length}`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedDate && (
        <section className="space-y-3">
          <h2 className="font-semibold text-gray-800">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h2>

          {selectedMatches.length === 0 ? (
            <p className="text-gray-400 text-sm">No matches scheduled for this day.</p>
          ) : (
            selectedMatches.map((m) => <MatchCard key={m.id} match={m} />)
          )}
        </section>
      )}
    </div>
  );
}
