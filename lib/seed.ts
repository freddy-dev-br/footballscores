import { getDb } from "./db";

const TEAMS = [
  // Premier League
  { id: 57,  name: "Arsenal",              short_name: "Arsenal",    tla: "ARS", country: "England", competition_name: "Premier League", crest: "https://crests.football-data.org/57.png" },
  { id: 61,  name: "Chelsea",              short_name: "Chelsea",    tla: "CHE", country: "England", competition_name: "Premier League", crest: "https://crests.football-data.org/61.png" },
  { id: 64,  name: "Liverpool",            short_name: "Liverpool",  tla: "LIV", country: "England", competition_name: "Premier League", crest: "https://crests.football-data.org/64.png" },
  { id: 65,  name: "Manchester City",      short_name: "Man City",   tla: "MCI", country: "England", competition_name: "Premier League", crest: "https://crests.football-data.org/65.png" },
  { id: 66,  name: "Manchester United",    short_name: "Man Utd",    tla: "MUN", country: "England", competition_name: "Premier League", crest: "https://crests.football-data.org/66.png" },
  { id: 73,  name: "Tottenham Hotspur",    short_name: "Spurs",      tla: "TOT", country: "England", competition_name: "Premier League", crest: "https://crests.football-data.org/73.png" },
  { id: 563, name: "West Ham United",      short_name: "West Ham",   tla: "WHU", country: "England", competition_name: "Premier League", crest: "https://crests.football-data.org/563.png" },
  { id: 76,  name: "Wolverhampton",        short_name: "Wolves",     tla: "WOL", country: "England", competition_name: "Premier League", crest: "https://crests.football-data.org/76.png" },
  { id: 328, name: "Burnley",              short_name: "Burnley",    tla: "BUR", country: "England", competition_name: "Premier League", crest: "https://crests.football-data.org/328.png" },
  { id: 354, name: "Crystal Palace",       short_name: "Crystal P",  tla: "CRY", country: "England", competition_name: "Premier League", crest: "https://crests.football-data.org/354.png" },
  // La Liga
  { id: 86,  name: "Real Madrid",          short_name: "Real Madrid",tla: "RMA", country: "Spain",   competition_name: "La Liga",         crest: "https://crests.football-data.org/86.png" },
  { id: 81,  name: "FC Barcelona",         short_name: "Barcelona",  tla: "BAR", country: "Spain",   competition_name: "La Liga",         crest: "https://crests.football-data.org/81.png" },
  { id: 78,  name: "Atletico Madrid",      short_name: "Atletico",   tla: "ATM", country: "Spain",   competition_name: "La Liga",         crest: "https://crests.football-data.org/78.png" },
  { id: 90,  name: "Real Sociedad",        short_name: "Sociedad",   tla: "RSO", country: "Spain",   competition_name: "La Liga",         crest: "https://crests.football-data.org/90.png" },
  { id: 77,  name: "Athletic Club",        short_name: "Athletic",   tla: "ATH", country: "Spain",   competition_name: "La Liga",         crest: "https://crests.football-data.org/77.png" },
  // Bundesliga
  { id: 5,   name: "Bayern Munich",        short_name: "Bayern",     tla: "BAY", country: "Germany", competition_name: "Bundesliga",      crest: "https://crests.football-data.org/5.png" },
  { id: 4,   name: "Borussia Dortmund",    short_name: "Dortmund",   tla: "BVB", country: "Germany", competition_name: "Bundesliga",      crest: "https://crests.football-data.org/4.png" },
  { id: 721, name: "RB Leipzig",           short_name: "Leipzig",    tla: "RBL", country: "Germany", competition_name: "Bundesliga",      crest: "https://crests.football-data.org/721.png" },
  { id: 3,   name: "Bayer Leverkusen",     short_name: "Leverkusen", tla: "LEV", country: "Germany", competition_name: "Bundesliga",      crest: "https://crests.football-data.org/3.png" },
  // Serie A
  { id: 109, name: "Juventus",             short_name: "Juventus",   tla: "JUV", country: "Italy",   competition_name: "Serie A",         crest: "https://crests.football-data.org/109.png" },
  { id: 108, name: "Inter Milan",          short_name: "Inter",      tla: "INT", country: "Italy",   competition_name: "Serie A",         crest: "https://crests.football-data.org/108.png" },
  { id: 98,  name: "AC Milan",             short_name: "Milan",      tla: "MIL", country: "Italy",   competition_name: "Serie A",         crest: "https://crests.football-data.org/98.png" },
  { id: 113, name: "AS Roma",              short_name: "Roma",       tla: "ROM", country: "Italy",   competition_name: "Serie A",         crest: "https://crests.football-data.org/113.png" },
  // Ligue 1
  { id: 524, name: "Paris Saint-Germain",  short_name: "PSG",        tla: "PSG", country: "France",  competition_name: "Ligue 1",         crest: "https://crests.football-data.org/524.png" },
  { id: 516, name: "Olympique de Marseille", short_name: "Marseille",tla: "OM",  country: "France",  competition_name: "Ligue 1",         crest: "https://crests.football-data.org/516.png" },
  { id: 523, name: "Olympique Lyonnais",   short_name: "Lyon",       tla: "OL",  country: "France",  competition_name: "Ligue 1",         crest: "https://crests.football-data.org/523.png" },
];

// Dates relative to today (2026-05-15)
const MATCHES = [
  // Premier League – finished
  { id: 1001, comp: "Premier League", comp_id: 2021, home: 57,  away: 61,  date: "2026-05-10T14:00:00Z", status: "FINISHED",  hs: 2, as: 1, md: 36 },
  { id: 1002, comp: "Premier League", comp_id: 2021, home: 64,  away: 65,  date: "2026-05-10T16:30:00Z", status: "FINISHED",  hs: 1, as: 1, md: 36 },
  { id: 1003, comp: "Premier League", comp_id: 2021, home: 66,  away: 73,  date: "2026-05-11T13:00:00Z", status: "FINISHED",  hs: 0, as: 2, md: 36 },
  { id: 1004, comp: "Premier League", comp_id: 2021, home: 354, away: 563, date: "2026-05-11T15:00:00Z", status: "FINISHED",  hs: 3, as: 1, md: 36 },
  // Premier League – live right now
  { id: 1005, comp: "Premier League", comp_id: 2021, home: 65,  away: 57,  date: "2026-05-15T15:00:00Z", status: "IN_PLAY",   hs: 1, as: 0, md: 37 },
  { id: 1006, comp: "Premier League", comp_id: 2021, home: 73,  away: 64,  date: "2026-05-15T15:00:00Z", status: "IN_PLAY",   hs: 2, as: 2, md: 37 },
  // Premier League – upcoming
  { id: 1007, comp: "Premier League", comp_id: 2021, home: 61,  away: 66,  date: "2026-05-18T19:45:00Z", status: "SCHEDULED", hs: null, as: null, md: 38 },
  { id: 1008, comp: "Premier League", comp_id: 2021, home: 57,  away: 76,  date: "2026-05-19T19:45:00Z", status: "SCHEDULED", hs: null, as: null, md: 38 },
  { id: 1009, comp: "Premier League", comp_id: 2021, home: 64,  away: 354, date: "2026-05-19T19:45:00Z", status: "SCHEDULED", hs: null, as: null, md: 38 },
  // La Liga – finished
  { id: 2001, comp: "La Liga",        comp_id: 2014, home: 86,  away: 81,  date: "2026-05-11T20:00:00Z", status: "FINISHED",  hs: 3, as: 2, md: 35 },
  { id: 2002, comp: "La Liga",        comp_id: 2014, home: 78,  away: 90,  date: "2026-05-11T17:30:00Z", status: "FINISHED",  hs: 1, as: 0, md: 35 },
  // La Liga – upcoming
  { id: 2003, comp: "La Liga",        comp_id: 2014, home: 81,  away: 78,  date: "2026-05-17T19:00:00Z", status: "SCHEDULED", hs: null, as: null, md: 36 },
  { id: 2004, comp: "La Liga",        comp_id: 2014, home: 86,  away: 77,  date: "2026-05-18T20:00:00Z", status: "SCHEDULED", hs: null, as: null, md: 36 },
  // Bundesliga – finished
  { id: 3001, comp: "Bundesliga",     comp_id: 2002, home: 5,   away: 4,   date: "2026-05-09T17:30:00Z", status: "FINISHED",  hs: 4, as: 0, md: 33 },
  { id: 3002, comp: "Bundesliga",     comp_id: 2002, home: 3,   away: 721, date: "2026-05-10T14:30:00Z", status: "FINISHED",  hs: 2, as: 2, md: 33 },
  // Bundesliga – upcoming
  { id: 3003, comp: "Bundesliga",     comp_id: 2002, home: 4,   away: 3,   date: "2026-05-16T16:30:00Z", status: "SCHEDULED", hs: null, as: null, md: 34 },
  // Serie A – live
  { id: 4001, comp: "Serie A",        comp_id: 2019, home: 108, away: 109, date: "2026-05-15T19:45:00Z", status: "IN_PLAY",   hs: 0, as: 1, md: 36 },
  // Serie A – upcoming
  { id: 4002, comp: "Serie A",        comp_id: 2019, home: 98,  away: 113, date: "2026-05-17T18:00:00Z", status: "SCHEDULED", hs: null, as: null, md: 36 },
  // Ligue 1 – finished
  { id: 5001, comp: "Ligue 1",        comp_id: 2015, home: 524, away: 516, date: "2026-05-12T20:00:00Z", status: "FINISHED",  hs: 5, as: 0, md: 33 },
  { id: 5002, comp: "Ligue 1",        comp_id: 2015, home: 523, away: 524, date: "2026-05-14T19:00:00Z", status: "SCHEDULED", hs: null, as: null, md: 34 },
];

export function seedDatabase() {
  const db = getDb();

  const teamById = Object.fromEntries(TEAMS.map((t) => [t.id, t]));

  const insertTeam = db.prepare(`
    INSERT OR REPLACE INTO teams (id, name, short_name, tla, crest, country, competition_name)
    VALUES (@id, @name, @short_name, @tla, @crest, @country, @competition_name)
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

  const txTeams = db.transaction(() => {
    for (const t of TEAMS) insertTeam.run(t);
  });
  txTeams();

  const txMatches = db.transaction(() => {
    for (const m of MATCHES) {
      const home = teamById[m.home];
      const away = teamById[m.away];
      insertMatch.run({
        id: m.id,
        competition_id: m.comp_id,
        competition_name: m.comp,
        home_team_id: m.home,
        home_team_name: home.name,
        home_team_crest: home.crest,
        away_team_id: m.away,
        away_team_name: away.name,
        away_team_crest: away.crest,
        match_date: m.date,
        status: m.status,
        home_score: m.hs ?? null,
        away_score: m.as ?? null,
        matchday: m.md,
        season: "2025",
        last_synced: new Date().toISOString(),
      });
    }
  });
  txMatches();

  return { teams: TEAMS.length, matches: MATCHES.length };
}
