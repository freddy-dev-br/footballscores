import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { WEARABLE_PROVIDERS } from "@/lib/wearables";

function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerId } = await params;
  const provider = WEARABLE_PROVIDERS[providerId];
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 404 });

  const db = getDb();
  const conn = db.prepare("SELECT * FROM wearable_connections WHERE provider = ?").get(providerId) as
    | { access_token: string | null; status: string }
    | undefined;

  if (!conn || conn.status !== "connected" || !conn.access_token) {
    return NextResponse.json({ error: `${provider.name} is not connected yet.` }, { status: 400 });
  }

  let stepsSynced = 0;
  let sleepSynced = 0;

  const upsertSteps = db.prepare(
    `INSERT INTO steps_log (date, count, source, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET count = excluded.count, source = excluded.source, updated_at = excluded.updated_at`
  );
  const upsertSleep = db.prepare(
    `INSERT INTO sleep_log (date, sleep_start, sleep_end, duration_minutes, source, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET sleep_start = excluded.sleep_start, sleep_end = excluded.sleep_end, duration_minutes = excluded.duration_minutes, source = excluded.source, updated_at = excluded.updated_at`
  );

  for (const date of last7Days()) {
    if (provider.fetchSteps) {
      const steps = await provider.fetchSteps(conn.access_token, date);
      if (steps !== null) {
        upsertSteps.run(date, steps, providerId, new Date().toISOString());
        stepsSynced++;
      }
    }
    if (provider.fetchSleep) {
      const sleep = await provider.fetchSleep(conn.access_token, date);
      if (sleep) {
        upsertSleep.run(date, sleep.start, sleep.end, sleep.durationMinutes, providerId, new Date().toISOString());
        sleepSynced++;
      }
    }
  }

  db.prepare("UPDATE wearable_connections SET last_sync_at = ? WHERE provider = ?").run(
    new Date().toISOString(),
    providerId
  );

  return NextResponse.json({ stepsSynced, sleepSynced });
}
