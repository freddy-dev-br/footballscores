import { WearableProvider } from "./types";

const AUTHORIZE_URL = "https://www.fitbit.com/oauth2/authorize";
const TOKEN_URL = "https://api.fitbit.com/oauth2/token";
const API_BASE = "https://api.fitbit.com";

export const fitbitProvider: WearableProvider = {
  id: "fitbit",
  name: "Fitbit",
  authType: "oauth",
  configEnvVars: ["FITBIT_CLIENT_ID", "FITBIT_CLIENT_SECRET"],
  description: "Connects via the Fitbit Web API (OAuth2) to pull daily steps and sleep sessions.",

  isConfigured() {
    return Boolean(process.env.FITBIT_CLIENT_ID && process.env.FITBIT_CLIENT_SECRET);
  },

  getAuthUrl(redirectUri, state) {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.FITBIT_CLIENT_ID!,
      redirect_uri: redirectUri,
      scope: "activity sleep profile",
      state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  },

  async exchangeCode(code, redirectUri) {
    const clientId = process.env.FITBIT_CLIENT_ID!;
    const clientSecret = process.env.FITBIT_CLIENT_SECRET!;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!res.ok) throw new Error(`Fitbit token exchange failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    };
  },

  async fetchSteps(accessToken, date) {
    const res = await fetch(`${API_BASE}/1/user/-/activities/date/${date}.json`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const steps = data?.summary?.steps;
    return typeof steps === "number" ? steps : null;
  },

  async fetchSleep(accessToken, date) {
    const res = await fetch(`${API_BASE}/1.2/user/-/sleep/date/${date}.json`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const session = data?.sleep?.[0];
    if (!session) return null;
    return {
      start: session.startTime ?? null,
      end: session.endTime ?? null,
      durationMinutes: Math.round((session.minutesAsleep ?? 0)),
    };
  },
};
