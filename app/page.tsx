"use client";

import useSWR from "swr";
import MatchCard, { Match } from "@/components/MatchCard";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const { data: liveMatches, isLoading } = useSWR<Match[]>(
    "/api/matches/live",
    fetcher,
    { refreshInterval: 60000 }
  );

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Live Scores</h1>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Updates every 60s
          </span>
        </div>

        {isLoading && <p className="text-gray-400 text-sm">Loading…</p>}
        {!isLoading && liveMatches?.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-2xl mb-2">😴</p>
            <p className="text-gray-600 font-medium">No live matches right now</p>
            <p className="text-gray-400 text-sm mt-1">Check the calendar for upcoming fixtures</p>
          </div>
        )}
        <div className="space-y-3">
          {liveMatches?.map((m) => <MatchCard key={m.id} match={m} />)}
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t pt-6">
        <Link
          href="/calendar"
          className="flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-xl p-4 hover:border-green-500 transition-colors text-center"
        >
          <span className="text-2xl">📅</span>
          <span className="text-sm font-semibold text-gray-800">Calendar</span>
          <span className="text-xs text-gray-400">Fixtures by date</span>
        </Link>
        <Link
          href="/news"
          className="flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-xl p-4 hover:border-green-500 transition-colors text-center"
        >
          <span className="text-2xl">📰</span>
          <span className="text-sm font-semibold text-gray-800">News</span>
          <span className="text-xs text-gray-400">BBC, Guardian, ESPN</span>
        </Link>
        <Link
          href="/search"
          className="flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-xl p-4 hover:border-green-500 transition-colors text-center"
        >
          <span className="text-2xl">🔍</span>
          <span className="text-sm font-semibold text-gray-800">Teams</span>
          <span className="text-xs text-gray-400">Search every club</span>
        </Link>
        <Link
          href="/favorites"
          className="flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-xl p-4 hover:border-green-500 transition-colors text-center"
        >
          <span className="text-2xl">⭐</span>
          <span className="text-sm font-semibold text-gray-800">My Teams</span>
          <span className="text-xs text-gray-400">Followed clubs</span>
        </Link>
      </section>
    </div>
  );
}
