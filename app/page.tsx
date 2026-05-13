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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Live Scores</h1>
        <p className="text-sm text-gray-500 mb-4">Updates every 60 seconds</p>
        {isLoading && <p className="text-gray-400 text-sm">Loading…</p>}
        {!isLoading && liveMatches?.length === 0 && (
          <p className="text-gray-500 text-sm">No live matches right now.</p>
        )}
        <div className="space-y-3">
          {liveMatches?.map((m) => <MatchCard key={m.id} match={m} />)}
        </div>
      </section>

      <section className="border-t pt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Get Started</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/search"
            className="flex-1 bg-green-700 text-white text-center py-3 rounded-lg font-medium hover:bg-green-800"
          >
            Search for your club
          </Link>
          <Link
            href="/favorites"
            className="flex-1 bg-white border border-gray-300 text-gray-800 text-center py-3 rounded-lg font-medium hover:bg-gray-50"
          >
            My favourite teams
          </Link>
        </div>
      </section>
    </div>
  );
}
