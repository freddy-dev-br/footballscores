import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { WEARABLE_PROVIDERS } from "@/lib/wearables";

export async function GET() {
  const db = await getDb();
  const result = await db.execute("SELECT * FROM wearable_connections");
  const connections = result.rows as unknown as {
    provider: string;
    status: string;
    connected_at: string | null;
    last_sync_at: string | null;
  }[];
  const byProvider = new Map(connections.map((c) => [c.provider, c]));

  const providers = Object.values(WEARABLE_PROVIDERS).map((p) => {
    const conn = byProvider.get(p.id);
    return {
      id: p.id,
      name: p.name,
      authType: p.authType,
      description: p.description,
      configured: p.isConfigured(),
      configEnvVars: p.configEnvVars,
      status: conn?.status ?? "disconnected",
      connectedAt: conn?.connected_at ?? null,
      lastSyncAt: conn?.last_sync_at ?? null,
    };
  });

  return NextResponse.json(providers);
}
