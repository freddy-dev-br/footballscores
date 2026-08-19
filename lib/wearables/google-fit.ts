import { WearableProvider } from "./types";

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AGGREGATE_URL = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate";

function dayRangeMs(date: string) {
  const start = new Date(`${date}T00:00:00.000Z`).getTime();
  const end = start + 24 * 60 * 60 * 1000;
  return { startMs: start, endMs: end };
}

export const googleFitProvider: WearableProvider = {
  id: "google_fit",
  name: "Google Fit",
  authType: "oauth",
  configEnvVars: ["GOOGLE_FIT_CLIENT_ID", "GOOGLE_FIT_CLIENT_SECRET"],
  description: "Connects via the Google Fit REST API (OAuth2) to pull aggregated daily steps and sleep sessions.",

  isConfigured() {
    return Boolean(process.env.GOOGLE_FIT_CLIENT_ID && process.env.GOOGLE_FIT_CLIENT_SECRET);
  },

  getAuthUrl(redirectUri, state) {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.GOOGLE_FIT_CLIENT_ID!,
      redirect_uri: redirectUri,
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/fitness.activity.read",
        "https://www.googleapis.com/auth/fitness.sleep.read",
      ].join(" "),
      state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  },

  async exchangeCode(code, redirectUri) {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_FIT_CLIENT_ID!,
        client_secret: process.env.GOOGLE_FIT_CLIENT_SECRET!,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });
    if (!res.ok) throw new Error(`Google Fit token exchange failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    };
  },

  async fetchSteps(accessToken, date) {
    const { startMs, endMs } = dayRangeMs(date);
    const res = await fetch(AGGREGATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aggregateBy: [{ dataTypeName: "com.google.step_count.delta" }],
        bucketByTime: { durationMillis: endMs - startMs },
        startTimeMillis: startMs,
        endTimeMillis: endMs,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const points = data?.bucket?.[0]?.dataset?.[0]?.point ?? [];
    const total = points.reduce((sum: number, p: { value?: { intVal?: number }[] }) => {
      return sum + (p.value?.[0]?.intVal ?? 0);
    }, 0);
    return total;
  },

  async fetchSleep() {
    // Google Fit's sleep segment API requires the fitness.sleep.read scope
    // and a separate sessions.list call; left as a follow-up once a real
    // client is registered and this can be tested against live data.
    return null;
  },
};
