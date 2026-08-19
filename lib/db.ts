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

    CREATE TABLE IF NOT EXISTS fitness_profile (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'User',
      age INTEGER,
      weight_kg REAL,
      height_cm REAL,
      goal TEXT DEFAULT 'maintenance',
      daily_calorie_target INTEGER DEFAULT 2000,
      daily_step_target INTEGER DEFAULT 10000,
      sleep_target_hours REAL DEFAULT 8.0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'cardio',
      name TEXT NOT NULL,
      duration_minutes INTEGER,
      calories_burned INTEGER,
      distance_km REAL,
      notes TEXT,
      logged_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      calories INTEGER,
      protein_g REAL,
      carbs_g REAL,
      fat_g REAL,
      ai_analysis TEXT,
      photo_data TEXT,
      meal_type TEXT DEFAULT 'snack',
      logged_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_steps (
      id INTEGER PRIMARY KEY,
      date TEXT UNIQUE NOT NULL,
      steps INTEGER DEFAULT 0,
      distance_km REAL DEFAULT 0,
      calories_burned INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sleep_sessions (
      id INTEGER PRIMARY KEY,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration_minutes INTEGER,
      quality TEXT DEFAULT 'good',
      deep_sleep_minutes INTEGER DEFAULT 0,
      rem_sleep_minutes INTEGER DEFAULT 0,
      light_sleep_minutes INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(logged_at);
    CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(logged_at);
    CREATE INDEX IF NOT EXISTS idx_steps_date ON daily_steps(date);
    CREATE INDEX IF NOT EXISTS idx_sleep_date ON sleep_sessions(date);
  `);
}
