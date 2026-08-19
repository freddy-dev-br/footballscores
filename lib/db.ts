import Database from "better-sqlite3";
import path from "path";
import { EXERCISE_LIBRARY } from "./exercise-library";

const DB_PATH = path.join(process.cwd(), "fitness.db");

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
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      goal_type TEXT NOT NULL DEFAULT 'maintenance',
      target_calories INTEGER,
      target_protein_g INTEGER,
      target_carbs_g INTEGER,
      target_fat_g INTEGER,
      target_steps INTEGER DEFAULT 8000,
      target_sleep_hours REAL DEFAULT 8,
      target_workouts_per_week INTEGER DEFAULT 3,
      notes TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      logged_at TEXT NOT NULL,
      meal_type TEXT,
      photo_data TEXT,
      description TEXT,
      calories INTEGER,
      protein_g REAL,
      carbs_g REAL,
      fat_g REAL,
      confidence REAL,
      needs_more_info INTEGER DEFAULT 0,
      clarifying_question TEXT,
      ai_notes TEXT,
      raw_analysis TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_meals_logged_at ON meals(logged_at);

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      equipment TEXT,
      difficulty TEXT,
      instructions TEXT,
      video_search_query TEXT
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheduled_date TEXT NOT NULL,
      name TEXT NOT NULL,
      goal_focus TEXT,
      notes TEXT,
      completed INTEGER DEFAULT 0,
      completed_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      order_index INTEGER DEFAULT 0,
      sets INTEGER,
      reps INTEGER,
      weight_kg REAL,
      duration_seconds INTEGER,
      completed INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises(workout_id);

    CREATE TABLE IF NOT EXISTS steps_log (
      date TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sleep_log (
      date TEXT PRIMARY KEY,
      sleep_start TEXT,
      sleep_end TEXT,
      duration_minutes INTEGER NOT NULL,
      quality TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS body_weight (
      date TEXT PRIMARY KEY,
      weight_kg REAL NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wearable_connections (
      provider TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'disconnected',
      access_token TEXT,
      refresh_token TEXT,
      expires_at TEXT,
      connected_at TEXT,
      last_sync_at TEXT,
      meta TEXT
    );
  `);

  const goalCount = db.prepare("SELECT COUNT(*) as c FROM goals").get() as { c: number };
  if (goalCount.c === 0) {
    db.prepare(
      `INSERT INTO goals (id, goal_type, target_calories, target_protein_g, target_carbs_g, target_fat_g, target_steps, target_sleep_hours, target_workouts_per_week, updated_at)
       VALUES (1, 'maintenance', 2200, 140, 220, 70, 8000, 8, 3, ?)`
    ).run(new Date().toISOString());
  }

  const exerciseCount = db.prepare("SELECT COUNT(*) as c FROM exercises").get() as { c: number };
  if (exerciseCount.c === 0) {
    const insert = db.prepare(
      `INSERT INTO exercises (id, name, category, muscle_group, equipment, difficulty, instructions, video_search_query)
       VALUES (@id, @name, @category, @muscle_group, @equipment, @difficulty, @instructions, @video_search_query)`
    );
    const insertMany = db.transaction((rows: typeof EXERCISE_LIBRARY) => {
      for (const row of rows) insert.run(row);
    });
    insertMany(EXERCISE_LIBRARY);
  }

  const wearableProviders = ["fitbit", "google_fit", "apple_health", "garmin"];
  const insertProvider = db.prepare(
    `INSERT OR IGNORE INTO wearable_connections (provider, status) VALUES (?, 'disconnected')`
  );
  for (const p of wearableProviders) insertProvider.run(p);
}
