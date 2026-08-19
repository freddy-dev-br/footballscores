export interface TokenResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface WearableProvider {
  id: string;
  name: string;
  authType: "oauth" | "file_import" | "unavailable";
  /** Env vars that must be set for this provider to be usable. */
  configEnvVars: string[];
  description: string;
  isConfigured(): boolean;
  getAuthUrl?(redirectUri: string, state: string): string;
  exchangeCode?(code: string, redirectUri: string): Promise<TokenResult>;
  fetchSteps?(accessToken: string, date: string): Promise<number | null>;
  fetchSleep?(
    accessToken: string,
    date: string
  ): Promise<{ start: string | null; end: string | null; durationMinutes: number } | null>;
}
