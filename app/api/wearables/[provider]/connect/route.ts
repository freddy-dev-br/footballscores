import { NextRequest, NextResponse } from "next/server";
import { WEARABLE_PROVIDERS } from "@/lib/wearables";
import crypto from "crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerId } = await params;
  const provider = WEARABLE_PROVIDERS[providerId];
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 404 });

  if (provider.authType !== "oauth" || !provider.getAuthUrl) {
    return NextResponse.json(
      { error: `${provider.name} does not support OAuth connect. ${provider.description}` },
      { status: 400 }
    );
  }

  if (!provider.isConfigured()) {
    return NextResponse.json(
      {
        error: `${provider.name} is not configured. Set ${provider.configEnvVars.join(" and ")} in .env.local first.`,
        code: "not_configured",
      },
      { status: 400 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const redirectUri = `${req.nextUrl.origin}/api/wearables/${providerId}/callback`;
  const authUrl = provider.getAuthUrl(redirectUri, state);

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(`wearable_oauth_state_${providerId}`, state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
  });
  return res;
}
