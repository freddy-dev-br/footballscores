"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import MatchCard, { Match } from "@/components/MatchCard";
import { getFavorites } from "@/components/FavoriteButton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Team {
  id: number;
  name: string;
  short_name: string;
  crest: string;
  country: string;
  competition_name: string;
}

function TeamFixtures({ teamId }: { teamId: number }) {
  const { data: matches } = useSWR<Match[]>(
    `/api/teams/${teamId}/matches?type=fixtures`,
    fetcher,
    { refreshInterval: 60000 }
  );
  if (!matches?.length) return null;
  return (
    <div className="space-y-2">
      {matches.slice(0, 3).map((m) => <MatchCard key={m.id} match={m} />)}
    </div>
  );
}

export default function FavoritesPage() {
  const [favIds, setFavIds] = useState<number[]>([]);

  useEffect(() => {
    setFavIds(getFavorites());
  }, []);

  const { data: allTeams } = useSWR<Team[]>(
    favIds.length ? `/api/teams/search?q=` : null,
    fetcher
  );

  const favTeams = allTeams?.filter((t) => favIds.includes(t.id)) ?? [];

  if (favIds.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-4xl">⭐</p>
        <h1 className="text-xl font-semibold text-gray-800">No favourite teams yet</h1>
        <p className="text-gray-500 text-sm">Search for a team and tap the star to follow it.</p>
        <Link href="/search" className="inline-block bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-800">
          Find a team
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">My Teams</h1>
      {favIds.map((id) => {
        const team = favTeams.find((t) => t.id === id);
        return (
          <section key={id} className="space-y-3">
            <Link href={`/teams/${id}`} className="flex items-center gap-3 hover:opacity-80">
              {team?.crest ? (
                <Image src={team.crest} alt={team.name} width={32} height={32} className="object-contain" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200" />
              )}
              <div>
                <div className="font-semibold text-gray-900">{team?.name ?? `Team ${id}`}</div>
                {team && <div className="text-xs text-gray-500">{team.competition_name}</div>}
              </div>
            </Link>
            <TeamFixtures teamId={id} />
          </section>
        );
      })}
    </div>
  );
}
