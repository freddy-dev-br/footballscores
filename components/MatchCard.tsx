"use client";

import Image from "next/image";

export interface Match {
  id: number;
  competition_name: string;
  home_team_id: number;
  home_team_name: string;
  home_team_crest: string;
  away_team_id: number;
  away_team_name: string;
  away_team_crest: string;
  match_date: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  matchday: number | null;
}

const LIVE_STATUSES = new Set(["LIVE", "IN_PLAY", "PAUSED"]);
const FINISHED_STATUSES = new Set(["FINISHED"]);

export default function MatchCard({ match }: { match: Match }) {
  const isLive = LIVE_STATUSES.has(match.status);
  const isFinished = FINISHED_STATUSES.has(match.status);
  const hasScore = match.home_score !== null && match.away_score !== null;

  const dateStr = new Date(match.match_date).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{match.competition_name}</span>
        {isLive && (
          <span className="flex items-center gap-1 text-red-600 font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        )}
        {!isLive && <span>{match.matchday ? `MD ${match.matchday}` : ""}</span>}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <TeamSide crest={match.home_team_crest} name={match.home_team_name} align="right" />

        <div className="text-center min-w-[64px]">
          {hasScore ? (
            <span className={`text-xl font-bold ${isLive ? "text-red-600" : "text-gray-900"}`}>
              {match.home_score} – {match.away_score}
            </span>
          ) : (
            <span className="text-sm text-gray-500">{dateStr}</span>
          )}
          {isFinished && <div className="text-xs text-gray-400 mt-0.5">FT</div>}
        </div>

        <TeamSide crest={match.away_team_crest} name={match.away_team_name} align="left" />
      </div>

      {!hasScore && (
        <div className="text-center text-xs text-gray-400">{dateStr}</div>
      )}
    </div>
  );
}

function TeamSide({
  crest,
  name,
  align,
}: {
  crest: string;
  name: string;
  align: "left" | "right";
}) {
  return (
    <div className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
      {crest ? (
        <Image src={crest} alt={name} width={28} height={28} className="object-contain" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gray-200" />
      )}
      <span className={`text-sm font-medium text-gray-800 text-${align} leading-tight`}>
        {name}
      </span>
    </div>
  );
}
