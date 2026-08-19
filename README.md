# FitTrack

An AI-powered workout, nutrition, sleep and step tracker built with Next.js.

## Features

- **Nutrition**: photograph a meal and get an AI calorie/macro estimate (OpenAI vision). If the photo is ambiguous, it asks a clarifying question and refines the estimate.
- **Workouts**: a starter exercise library with proper-form video links, a workout builder, and per-exercise set/rep logging.
- **Activity**: steps and sleep tracking via manual entry, CSV import, or an Apple Health `export.xml` import.
- **Wearables**: a pluggable connector framework with working OAuth flows for Fitbit and Google Fit (once you supply your own developer credentials), file-based import for Apple Health, and Garmin listed as unavailable (it has no self-serve API).
- **AI coach**: a dashboard card that generates short, personalized nutrition/training advice from your goals and recent logs.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in the keys you want to use
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Enabling AI features

Set `OPENAI_API_KEY` in `.env.local`. Without it, food-photo analysis and the AI coach return a clear "not configured" message instead of failing silently.

### Connecting wearables

- **Fitbit / Google Fit**: register a developer app with the provider, set the client id/secret env vars (see `.env.local.example` for the exact redirect URIs to register), then use the Connect button in Settings.
- **Apple Health**: no OAuth needed — export your data from the Health app (Profile → Export All Health Data) and upload `export.xml` in Settings.
- **Garmin**: Garmin's Health API requires a negotiated partner agreement rather than self-serve signup, so it isn't wired up; use manual entry or CSV import in the meantime.

## Data

Everything is stored locally in a SQLite database (`fitness.db`, gitignored) via `better-sqlite3` — this is a single-user, local-first app.
