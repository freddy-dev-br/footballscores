import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "football.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT,
      tla TEXT,
      crest TEXT,
      country TEXT,
      competition_id INTEGER,
      competition_name TEXT
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY,
      competition_id INTEGER,
      competition_name TEXT,
      home_team_id INTEGER,
      home_team_name TEXT,
      home_team_crest TEXT,
      away_team_id INTEGER,
      away_team_name TEXT,
      away_team_crest TEXT,
      match_date TEXT,
      status TEXT,
      home_score INTEGER,
      away_score INTEGER,
      matchday INTEGER,
      season TEXT,
      last_synced TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_matches_home ON matches(home_team_id);
    CREATE INDEX IF NOT EXISTS idx_matches_away ON matches(away_team_id);
    CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
    CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
    CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
    CREATE INDEX IF NOT EXISTS idx_teams_country ON teams(country);
  `);
}
