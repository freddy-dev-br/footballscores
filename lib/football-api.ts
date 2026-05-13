const BASE_URL = "https://api.football-data.org/v4";

// Supported competition codes on the free tier
export const COMPETITIONS = [
  { code: "PL",  name: "Premier League",    country: "England" },
  { code: "PD",  name: "La Liga",           country: "Spain" },
  { code: "BL1", name: "Bundesliga",        country: "Germany" },
  { code: "SA",  name: "Serie A",           country: "Italy" },
  { code: "FL1", name: "Ligue 1",           country: "France" },
  { code: "PPL", name: "Primeira Liga",     country: "Portugal" },
  { code: "DED", name: "Eredivisie",        country: "Netherlands" },
  { code: "CL",  name: "Champions League",  country: "Europe" },
  { code: "ELC", name: "Championship",      country: "England" },
];

async function apiFetch(path: string) {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) throw new Error("FOOTBALL_API_KEY not set");

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-Auth-Token": key },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Football API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchTeams(competitionCode: string) {
  const data = await apiFetch(`/competitions/${competitionCode}/teams`);
  return data.teams as ApiTeam[];
}

export async function fetchMatches(competitionCode: string) {
  const data = await apiFetch(`/competitions/${competitionCode}/matches`);
  return data.matches as ApiMatch[];
}

export async function fetchLiveMatches() {
  const data = await apiFetch("/matches?status=LIVE,IN_PLAY,PAUSED");
  return data.matches as ApiMatch[];
}

export interface ApiTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  area: { name: string };
}

export interface ApiMatch {
  id: number;
  competition: { id: number; name: string };
  homeTeam: { id: number; name: string; crest: string };
  awayTeam: { id: number; name: string; crest: string };
  utcDate: string;
  status: string;
  score: {
    fullTime: { home: number | null; away: number | null };
  };
  matchday: number;
  season: { startDate: string };
}
