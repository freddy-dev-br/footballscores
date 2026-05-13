import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { fetchTeams, fetchMatches, COMPETITIONS } from "@/lib/football-api";

export async function POST(req: NextRequest) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runSync();
}

export async function GET(req: NextRequest) {
  // Allow unauthenticated GET only in development
  if (process.env.NODE_ENV !== "development") {
    if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  return runSync();
}

async function runSync() {
  const db = getDb();
  const errors: string[] = [];
  let teamCount = 0;
  let matchCount = 0;

  const insertTeam = db.prepare(`
    INSERT OR REPLACE INTO teams (id, name, short_name, tla, crest, country, competition_id, competition_name)
    VALUES (@id, @name, @short_name, @tla, @crest, @country, @competition_id, @competition_name)
  `);

  const insertMatch = db.prepare(`
    INSERT OR REPLACE INTO matches (
      id, competition_id, competition_name,
      home_team_id, home_team_name, home_team_crest,
      away_team_id, away_team_name, away_team_crest,
      match_date, status, home_score, away_score, matchday, season, last_synced
    ) VALUES (
      @id, @competition_id, @competition_name,
      @home_team_id, @home_team_name, @home_team_crest,
      @away_team_id, @away_team_name, @away_team_crest,
      @match_date, @status, @home_score, @away_score, @matchday, @season, @last_synced
    )
  `);

  for (const comp of COMPETITIONS) {
    try {
      const [teams, matches] = await Promise.all([
        fetchTeams(comp.code),
        fetchMatches(comp.code),
      ]);

      const txTeams = db.transaction(() => {
        for (const t of teams) {
          insertTeam.run({
            id: t.id,
            name: t.name,
            short_name: t.shortName,
            tla: t.tla,
            crest: t.crest,
            country: t.area?.name ?? comp.country,
            competition_id: null,
            competition_name: comp.name,
          });
          teamCount++;
        }
      });
      txTeams();

      const txMatches = db.transaction(() => {
        for (const m of matches) {
          insertMatch.run({
            id: m.id,
            competition_id: m.competition.id,
            competition_name: m.competition.name,
            home_team_id: m.homeTeam.id,
            home_team_name: m.homeTeam.name,
            home_team_crest: m.homeTeam.crest,
            away_team_id: m.awayTeam.id,
            away_team_name: m.awayTeam.name,
            away_team_crest: m.awayTeam.crest,
            match_date: m.utcDate,
            status: m.status,
            home_score: m.score?.fullTime?.home ?? null,
            away_score: m.score?.fullTime?.away ?? null,
            matchday: m.matchday,
            season: m.season?.startDate?.slice(0, 4) ?? "",
            last_synced: new Date().toISOString(),
          });
          matchCount++;
        }
      });
      txMatches();

      // Respect rate limit: 10 req/min on free tier (2 requests per competition)
      await new Promise((r) => setTimeout(r, 6500));
    } catch (e: unknown) {
      errors.push(`${comp.code}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({ teamCount, matchCount, errors });
}
