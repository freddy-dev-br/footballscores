import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { WEARABLE_PROVIDERS } from "@/lib/wearables";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerId } = await params;
  const provider = WEARABLE_PROVIDERS[providerId];
  if (!provider || provider.authType !== "oauth" || !provider.exchangeCode) {
    return NextResponse.json({ error: "Unknown or unsupported provider" }, { status: 404 });
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get(`wearable_oauth_state_${providerId}`)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/settings?wearable_error=invalid_state", req.url));
  }

  try {
    const redirectUri = `${req.nextUrl.origin}/api/wearables/${providerId}/callback`;
    const token = await provider.exchangeCode(code, redirectUri);

    const db = getDb();
    db.prepare(
      `UPDATE wearable_connections SET status = 'connected', access_token = ?, refresh_token = ?, expires_at = ?, connected_at = ? WHERE provider = ?`
    ).run(token.accessToken, token.refreshToken ?? null, token.expiresAt ?? null, new Date().toISOString(), providerId);

    const res = NextResponse.redirect(new URL(`/settings?connected=${providerId}`, req.url));
    res.cookies.delete(`wearable_oauth_state_${providerId}`);
    return res;
  } catch (err) {
    console.error(`${providerId} OAuth callback failed:`, err);
    return NextResponse.redirect(new URL(`/settings?wearable_error=${providerId}_exchange_failed`, req.url));
  }
}
