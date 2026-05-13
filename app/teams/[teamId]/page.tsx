"use client";

import { use } from "react";
import useSWR from "swr";
import Image from "next/image";
import MatchCard, { Match } from "@/components/MatchCard";
import FavoriteButton from "@/components/FavoriteButton";
import { useState } from "react";

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

export default function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const [tab, setTab] = useState<"fixtures" | "results">("fixtures");

  const { data: teams } = useSWR<Team[]>(`/api/teams/search?q=${teamId}`, fetcher);
  const team = teams?.find((t) => String(t.id) === teamId);

  const { data: matches, isLoading } = useSWR<Match[]>(
    `/api/teams/${teamId}/matches?type=${tab}`,
    fetcher,
    { refreshInterval: tab === "fixtures" ? 60000 : 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {team?.crest ? (
          <Image src={team.crest} alt={team.name} width={56} height={56} className="object-contain" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-200" />
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{team?.name ?? `Team ${teamId}`}</h1>
          {team && (
            <p className="text-sm text-gray-500">{team.competition_name} · {team.country}</p>
          )}
        </div>
        <FavoriteButton teamId={Number(teamId)} />
      </div>

      <div className="flex border-b border-gray-200">
        {(["fixtures", "results"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? "border-green-700 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-gray-400 text-sm">Loading…</p>}
      {!isLoading && matches?.length === 0 && (
        <p className="text-gray-500 text-sm">No {tab} found.</p>
      )}
      <div className="space-y-3">
        {matches?.map((m) => <MatchCard key={m.id} match={m} />)}
      </div>
    </div>
  );
}
