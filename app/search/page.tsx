"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import { COMPETITIONS } from "@/lib/football-api";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Team {
  id: number;
  name: string;
  short_name: string;
  tla: string;
  crest: string;
  country: string;
  competition_name: string;
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [country, setCountry] = useState(searchParams.get("country") ?? "");
  const [competition, setCompetition] = useState(searchParams.get("competition") ?? "");

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (country) params.set("country", country);
  if (competition) params.set("competition", competition);

  const { data: teams, isLoading } = useSWR<Team[]>(
    params.toString() ? `/api/teams/search?${params}` : null,
    fetcher
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/search?${params}`);
  }

  const countries = Array.from(new Set(COMPETITIONS.map((c) => c.country))).sort();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Find a Team</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Team name…"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-green-600"
        />
        <div className="flex gap-3">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:border-green-600"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={competition}
            onChange={(e) => setCompetition(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:border-green-600"
          >
            <option value="">All competitions</option>
            {COMPETITIONS.map((c) => (
              <option key={c.code} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-green-700 text-white py-2.5 rounded-lg font-medium hover:bg-green-800"
        >
          Search
        </button>
      </form>

      {isLoading && <p className="text-gray-400 text-sm">Searching…</p>}

      {teams && teams.length === 0 && (
        <p className="text-gray-500 text-sm">No teams found. Try syncing data first via <code>/api/cron/sync</code>.</p>
      )}

      <div className="space-y-2">
        {teams?.map((team) => (
          <Link
            key={team.id}
            href={`/teams/${team.id}`}
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-green-500 transition-colors"
          >
            {team.crest ? (
              <Image src={team.crest} alt={team.name} width={32} height={32} className="object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{team.name}</div>
              <div className="text-xs text-gray-500">{team.competition_name} · {team.country}</div>
            </div>
            <span className="text-gray-400 text-lg">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}
