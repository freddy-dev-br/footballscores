import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { parseAppleHealthExport, parseCsvSteps, parseCsvSleep } from "@/lib/wearables";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerId } = await params;
  const body = await req.json();
  const kind: "csv_steps" | "csv_sleep" | "apple_health_xml" = body.kind;
  const content: string = body.content;

  if (!content || !kind) {
    return NextResponse.json({ error: "kind and content are required" }, { status: 400 });
  }

  const db = getDb();
  const upsertSteps = db.prepare(
    `INSERT INTO steps_log (date, count, source, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET count = excluded.count, source = excluded.source, updated_at = excluded.updated_at`
  );
  const upsertSleep = db.prepare(
    `INSERT INTO sleep_log (date, sleep_start, sleep_end, duration_minutes, source, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET sleep_start = excluded.sleep_start, sleep_end = excluded.sleep_end, duration_minutes = excluded.duration_minutes, source = excluded.source, updated_at = excluded.updated_at`
  );

  let stepsImported = 0;
  let sleepImported = 0;
  const now = new Date().toISOString();

  try {
    if (kind === "csv_steps") {
      const rows = parseCsvSteps(content);
      for (const r of rows) {
        upsertSteps.run(r.date, r.count, providerId, now);
        stepsImported++;
      }
    } else if (kind === "csv_sleep") {
      const rows = parseCsvSleep(content);
      for (const r of rows) {
        upsertSleep.run(r.date, r.start, r.end, r.durationMinutes, providerId, now);
        sleepImported++;
      }
    } else if (kind === "apple_health_xml") {
      const parsed = parseAppleHealthExport(content);
      for (const r of parsed.steps) {
        upsertSteps.run(r.date, r.count, "apple_health", now);
        stepsImported++;
      }
      for (const r of parsed.sleep) {
        upsertSleep.run(r.date, r.start, r.end, r.durationMinutes, "apple_health", now);
        sleepImported++;
      }
    } else {
      return NextResponse.json({ error: "Unknown import kind" }, { status: 400 });
    }
  } catch (err) {
    console.error("Wearable import failed:", err);
    return NextResponse.json({ error: "Could not parse the uploaded file." }, { status: 400 });
  }

  db.prepare(
    `UPDATE wearable_connections SET last_sync_at = ?, status = CASE WHEN status = 'disconnected' THEN 'manual_import' ELSE status END WHERE provider = ?`
  ).run(now, providerId);

  return NextResponse.json({ stepsImported, sleepImported });
}
